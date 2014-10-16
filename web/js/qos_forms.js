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
    var uuid = jQuery('#queue_id').val();
    var ingres = parseInt(jQuery.trim(jQuery('#queue_ingres').val()), 10);

    if (null != the_queue) {
        the_queue.set_ingres(ingres);
    } else {
        withProcessing(getProcessingSketchId(), function(pjs) {
            the_queue = new Queue(ingres, pjs.addNodeByType(QUEUE, ingres+"", STAGE_WIDTH/2, STAGE_HEIGHT/2));
        });
        jQuery('#queue_submit').text("Edit");
        enable_form('#consumer_form');
    }

    jQuery('#queue_id').val(ingres);
    return false;
}

function handle_consumer_form() {
    try {
        var c;
        var uuid = jQuery.trim(jQuery('#consumer_id').val());
        var delay = parseInt(jQuery.trim(jQuery('#consumer_delay').val()), 10);
        var qos = parseInt(jQuery.trim(jQuery('#consumer_qos').val()), 10);

        if (uuid == '') {
            uuid = randomNodeName();

            var c_name = "qos:" + qos;
            withProcessing(getProcessingSketchId(), function(pjs) {
                var c_node = pjs.addNodeByType(CONSUMER, c_name, -50, -50);
                c_node.setUUID(uuid);
                c = new Consumer(c_name, uuid, delay, c_node);
                consumers.push(c);

                arrange_consumers();
                c.subscribe(the_queue, qos);

                // jQuery('#consumer_id').val(uuid);

                // jQuery("#consumer_form").each(function () {
                //     this.reset();
                // });

                consumer_map[uuid] = c;
            });
        } else {
            // we are editing // stepping the consumer.
            // handle update of consumer qos or delay.
            c = consumer_map[uuid];
            c.set_qos(qos);
            c.set_delay(delay);
        }

    } catch (e) {
        console.log(e);
        return false;
    }

    return false;
}

function init_consumer_form(uuid) {
    var c = consumer_map[uuid];

    if (typeof c != 'undefined') {
        // init consumer form
        jQuery("#consumer_id").val(c.get_id());
        jQuery('#consumer_delay').val(c.get_delay());
        jQuery('#consumer_qos').val(c.get_qos());

        if (c.get_msg_len() > 0) {
            jQuery('#consumer_ack').prop('disabled', false);
        }
    }
}

function playback_play() {
    if (the_queue == null) {
        return;
    }

    var btn = jQuery(this);
    var icn = $('#playback_play i');

    if (btn.text() == ' Play') {
        btn.text(' Pause');
        icn.removeClass('icon-play');
        icn.addClass('icon-pause');
        queue_paused = false;
        the_queue.play();
    } else {
        btn.text(' Play');
        icn.removeClass('icon-pause');
        icn.addClass('icon-play');
        queue_paused = true;
        the_queue.pause();
    }
}

function playback_next() {
    if (the_queue == null) {
        return;
    }

    the_queue.grant_credit(1);
}

function consumer_ack() {

}

jQuery(document).ready(function() {
    init_form('#queue_form', handle_queue_form);
    init_form('#consumer_form', handle_consumer_form);
    disable_form('#consumer_form');

    jQuery('#playback_play').click(playback_play);

    jQuery('#playback_next').click(playback_next);

    jQuery('#consumer_ack').click(consumer_ack);
});