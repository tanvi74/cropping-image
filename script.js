var resizeableImage = function(imageTarget) {
  // Some variable and settings
  var $container,
  orig_src = new Image(),
  imageTarget = $(imageTarget).get(0),
  event_state = {},
  constrain = false,
  min_width = 60, // Change as required
  min_height = 60,
  max_width = 1800, // Change as required
  max_height = 1900,
  init_height=500,
  resizeCanvas = document.createElement('canvas');
  imageData=null;

  init = function(){
  
      // When resizing, we will always use this copy of the original as the base
    orig_src.src=imageTarget.src;

    // Wrap the image with the container and add resize handles
    $(imageTarget).height(init_height)
    .wrap('<div class="resize-container"></div>')
    .before('<span class="resize-handle resize-handle-nw"></span>')
    .before('<span class="resize-handle resize-handle-ne"></span>')
    .after('<span class="resize-handle resize-handle-se"></span>')
    .after('<span class="resize-handle resize-handle-sw"></span>');

    // Assign the container to a variable
    $container =  $('.resize-container');

	$container.prepend('<div class="resize-container-ontop"></div>');
	
    // Add events
    $container.on('mousedown touchstart', '.resize-handle', startResize);
    $container.on('mousedown touchstart', '.resize-container-ontop', startMoving);
    $('.crop').on('click', crop);
  };
  
  
  
  startResize = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    $(document).on('mousemove touchmove', resizing);
    $(document).on('mouseup touchend', endResize);
  };

  endResize = function(e){
	resizeImageCanvas($(imageTarget).width(), $(imageTarget).height())
    e.preventDefault();
    $(document).off('mouseup touchend', endResize);
    $(document).off('mousemove touchmove', resizing);
  };

  saveEventState = function(e){
    // Save the initial event details and container state
    event_state.container_width = $container.width();
    event_state.container_height = $container.height();
    event_state.container_left = $container.offset().left; 
    event_state.container_top = $container.offset().top;
    event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
	
	// This is a fix for mobile safari
	// For some reason it does not allow a direct copy of the touches property
	if(typeof e.originalEvent.touches !== 'undefined'){
		event_state.touches = [];
		$.each(e.originalEvent.touches, function(i, ob){
		  event_state.touches[i] = {};
		  event_state.touches[i].clientX = 0+ob.clientX;
		  event_state.touches[i].clientY = 0+ob.clientY;
		});
	}
    event_state.evnt = e;
  };

  resizing = function(e){
    var mouse={},width,height,left,top,offset=$container.offset();
    mouse.x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft(); 
    mouse.y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();
    
    // Position image differently depending on the corner dragged and constraints
    if( $(event_state.evnt.target).hasClass('resize-handle-se') ){
      width = mouse.x - event_state.container_left;
      height = mouse.y  - event_state.container_top;
      left = event_state.container_left;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-sw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = mouse.y  - event_state.container_top;
      left = mouse.x;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-nw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = mouse.x;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    } else if($(event_state.evnt.target).hasClass('resize-handle-ne') ){
      width = mouse.x - event_state.container_left;
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = event_state.container_left;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    }
	
    // Optionally maintain aspect ratio
    if(constrain || e.shiftKey){
      height = width / orig_src.width * orig_src.height;
    }

    if(width > min_width && height > min_height && width < max_width && height < max_height){
      // To improve performance you might limit how often resizeImage() is called
      resizeImage(width, height);  
      // Without this Firefox will not re-calculate the the image dimensions until drag end
      $container.offset({'left': left, 'top': top});
    }
  }

  resizeImage = function(width, height){
	$(imageTarget).width(width).height(height);
  };
  
  resizeImageCanvas = function(width, height){
    resizeCanvas.width = width;
    resizeCanvas.height = height;
    resizeCanvas.getContext('2d').drawImage(orig_src, 0, 0, width, height);   
    $(imageTarget).attr('src', resizeCanvas.toDataURL("image/png"));  
	//$(imageTarget).width(width).height(height);
  };

  startMoving = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    $(document).on('mousemove touchmove', moving);
    $(document).on('mouseup touchend', endMoving);
  };

  endMoving = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endMoving);
    $(document).off('mousemove touchmove', moving);
  };

  moving = function(e){
    var  mouse={}, touches;
    e.preventDefault();
    e.stopPropagation();
    
    touches = e.originalEvent.touches;
    
    mouse.x = (e.clientX || e.pageX || touches[0].clientX) + $(window).scrollLeft(); 
    mouse.y = (e.clientY || e.pageY || touches[0].clientY) + $(window).scrollTop();
    $container.offset({
      'left': mouse.x - ( event_state.mouse_x - event_state.container_left ),
      'top': mouse.y - ( event_state.mouse_y - event_state.container_top ) 
    });
    // Watch for pinch zoom gesture while moving
    if(event_state.touches && event_state.touches.length > 1 && touches.length > 1){
      var width = event_state.container_width, height = event_state.container_height;
      var a = event_state.touches[0].clientX - event_state.touches[1].clientX;
      a = a * a; 
      var b = event_state.touches[0].clientY - event_state.touches[1].clientY;
      b = b * b; 
      var dist1 = Math.sqrt( a + b );
      
      a = e.originalEvent.touches[0].clientX - touches[1].clientX;
      a = a * a; 
      b = e.originalEvent.touches[0].clientY - touches[1].clientY;
      b = b * b; 
      var dist2 = Math.sqrt( a + b );

      var ratio = dist2 /dist1;

      width = width * ratio;
      height = height * ratio;
      // To improve performance you might limit how often resizeImage() is called
      resizeImage(width, height);
    }
  };

  crop = function(){
    //Find the part of the image that is inside the crop box
    var cropCanvas,
        left = $('.overlay').offset().left- $container.offset().left,
        top =  $('.overlay').offset().top - $container.offset().top,
        width = $('.overlay').width(),
        height = $('.overlay').height();
		
    cropCanvas = document.createElement('canvas');
	
    cropCanvas.width = width;
    cropCanvas.height = height;
	
    cropCanvas.getContext('2d').drawImage(imageTarget, left, top, width, height, 0, 0, width, height);
	var dataURL=cropCanvas.toDataURL("image/png");
	imageTarget.src=dataURL;
	orig_src.src=imageTarget.src;
	
	
	$(imageTarget).bind("load",function() {
		$(this).css({
			width:width,
			height:height
		}).unbind('load').parent().css({
			top:$('.overlay').offset().top- $('.crop-wrapper').offset().top,
			left:$('.overlay').offset().left- $('.crop-wrapper').offset().left
		})
  });

  var val = Math.floor((Math.random() * 100) + 1);
  console.log(val);
 
  var value = `${window.location.href}?${val}`;
  console.log(value);
  window.history.pushState("object or string", "Title", value);
  }
  init();
};

// Kick everything off with the target image
resizeableImage($('.resizeImage'));


// TO download the image
$('.download').click(function() {
  var croppedimage = document.getElementsByClassName("resizeImage");
  // console.log(croppedimage[0].src)
    const image = croppedimage[0].src;
    var link = document.createElement('a');
    link.download = "my-image.png";
    link.href = image;
    link.click();
});


// const mementos = []
// var croppedimage = document.getElementsByClassName("resizeImage");

// function saveMemento() {
//   mementos.push(croppedimage)
// }

// function undo() {
//   const lastMemento = mementos.pop()
//   console.log(lastMemento)
//   croppedimage = lastMemento ? lastMemento : croppedimage
// }


// function goBack() {
//   var croppedimage = document.getElementsByClassName("resizeImage");
//   croppedimage.undo();
//   window.history.back();
// }
  