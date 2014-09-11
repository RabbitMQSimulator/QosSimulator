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
	    var ingres = parseInt(jQuery.trim(jQuery('#queue_ingres').val()), 10);

		withProcessing(getProcessingSketchId(), function(pjs) {
			the_queue = new Queue(ingres+"", ingres, pjs.addNodeByType(QUEUE, ingres+"", STAGE_WIDTH/2, STAGE_HEIGHT/2));
		});

	    jQuery('#queue_id').val(ingres);
		enable_form('#consumer_form');
		disable_form('#queue_form');
	} catch (e) {
		console.log(e);

	}

    return false;
}

function handle_consumer_form() {
	try {
	    var uuid = jQuery('#consumer_id').val();
	    var delay = parseInt(jQuery.trim(jQuery('#consumer_delay').val()), 10);
		var qos = parseInt(jQuery.trim(jQuery('#consumer_qos').val()), 10);

		var c_name = "qos:" + qos;
		var c = null;

		withProcessing(getProcessingSketchId(), function(pjs) {
		    c = new Consumer(c_name, delay, pjs.addNodeByType(CONSUMER, c_name, -50, -50));
			consumers.push(c);
		});

		arrange_consumers();
	    c.subscribe(the_queue, qos);

	    jQuery('#consumer_id').val(c_name);
	} catch (e) {
		console.log(e);
		return false;
	}

    return false;
}

jQuery(document).ready(function() {
    init_form('#queue_form', handle_queue_form);
	init_form('#consumer_form', handle_consumer_form);
	disable_form('#consumer_form');
});