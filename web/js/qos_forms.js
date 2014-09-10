var QUEUE = 0;
var CONSUMER = 1;

function reset_form(id) {
    jQuery(id).each(function () {
        this.reset();
    });
}

function disable_form(id) {
    jQuery(id).find(':input:not(:disabled)').prop('disabled', true);
}

function enable_form(id){
    jQuery(id).find(':input:disabled').prop('disabled', false);
}

function init_form(id, submit_callback) {
    jQuery(id).submit(submit_callback);
}

function handle_queue_form() {
	try {
	    console.log('handle_queue_form');
	    var uuid = jQuery('#queue_id').val();
	    var name = jQuery.trim(jQuery('#queue_name').val());
	    var pjs = getProcessing();
    
		n = pjs.addNodeByType(QUEUE, name, 50, 50);
		console.log(n);
	    jQuery('#queue_id').val(name);
	} catch (e) {
		console.log(e);
		
	}
   
    return false;
}

function handle_consumer_form() {
	try {
	    console.log('handle_consumer_form');
	    var uuid = jQuery('#consumer_id').val();
	    var name = jQuery.trim(jQuery('#consumer_name').val());
	    var pjs = getProcessing();
    
		n = pjs.addNodeByType(CONSUMER, name, 150, 150);
		
		if (n) {
			q = pjs.findNode("asdf");
			pjs.addConnection(n, q);
		}
		
	    jQuery('#consumer_id').val(name);
	} catch (e) {
		console.log(e);
		return false;
	}
   
    return false;
}

jQuery(document).ready(function() {
    init_form('#queue_form', handle_queue_form);
	init_form('#consumer_form', handle_consumer_form);
});