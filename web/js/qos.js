function Queue(ingres, node) {
    this.view = node;
    this.msg_id = 0;
    this.consumer_id = 0;
    this.consumers = [];
    this.messages = 0; // messages queued to this queue
    this.unacked_msgs = {}; //unacked msgs
    this.unacked_count = 0;
    this.paused = true;
    this.credit = 0;
    this.current_consumer = null;
    this.set_ingres(ingres);
}

Queue.prototype.get_paused = function() {
    return this.paused;
}

Queue.prototype.pause = function() {
    this.stop_ingres();
    this.paused = true;

    // for (var i = 0; i < this.consumers.length; i++) {
    //     this.consumers[i].consumer.pause();
    //     console.log("pause", this.consumers[i].consumer.paused);
    // }
}

Queue.prototype.play = function() {
    this.paused = false;

    for (var i = 0; i < this.consumers.length; i++) {
        this.consumers[i].consumer.play();
    }

    this.start_ingres();
}

Queue.prototype.grant_credit = function(c) {
    this.credit += c;
}

Queue.prototype.start_ingres = function() {
    var that = this;
    this.ingres_interval = setInterval(function () {
        that.enqueue(that.ingres);
    }, 1000);
}

Queue.prototype.stop_ingres = function() {
    clearInterval(this.ingres_interval);
}

Queue.prototype.restart_ingres = function() {
    this.stop_ingres();
    if (!this.paused) {
        this.start_ingres();
    }
}

Queue.prototype.get_view_node = function() {
    return this.view;
}

Queue.prototype.set_ingres = function (ingres) {
    this.ingres = ingres;
    this.get_view_node().setLabel(ingres+"");
	this.restart_ingres();
}

Queue.prototype.update_view_counters = function() {
    this.get_view_node().setMsgsNumber(this.messages);
    this.get_view_node().setUnackedNumber(this.unacked_count);
}

Queue.prototype.enqueue = function(amount) {
    this.incr_msgs(amount);
    this.update_view_counters();
    this.maybe_deliver_message();
}

Queue.prototype.decr_msgs = function(amount) {
    this.messages = this.messages - amount;
}

Queue.prototype.incr_msgs = function(amount) {
    this.messages = this.messages + amount;
}

Queue.prototype.decr_unacked_msgs = function(amount) {
    this.unacked_count = this.unacked_count - amount;
}

Queue.prototype.incr_unacked_msgs = function(amount) {
    this.unacked_count = this.unacked_count + amount;
}


Queue.prototype.maybe_deliver_message = function() {
    if (this.paused) {
        if (this.credit < 1) {
            return;
        } else {
            this.credit--;
        }
    }

    if (this.current_consumer == null || typeof this.current_consumer == 'undefined') {
        this.current_consumer = this.consumers.shift();
    }

    if (this.current_consumer) {

        var qos = this.current_consumer.basic_qos();

        if (qos == 0 || qos > this.unacked_msgs[this.current_consumer.get_id()].length) {
            if (this.messages > 0) {
                var msg_id = this.make_msg_id();
                this.move_msg_to_unacked(this.current_consumer.get_id(), msg_id);
                this.decr_msgs(1);
                this.update_view_counters();
                this.current_consumer.handle_msg(msg_id);
            }
        }

        if (qos != 0 && this.unacked_msgs[this.current_consumer.get_id()].length >= qos) {
            // stop sending messages to this consumer.
            console.log('rotate consumer');
            this.consumers.push(this.current_consumer);
            this.current_consumer = null;
        }
    } else {
        console.log('no current_consumer');
    }
}

Queue.prototype.move_msg_to_unacked = function (consumer_id, msg_id) {
    this.unacked_msgs[consumer_id].push(msg_id);
    this.incr_unacked_msgs(1);
    this.update_view_counters();
}

Queue.prototype.add_consumer = function(consumer) {
    var c = {
        consumer: consumer,
        get_id: function () {
            return consumer.get_id();
        },
        grant_credit: function(credit) {
            consumer.grant_credit(credit);
        },
        handle_msg: function(msg) {
            consumer.handle_msg(msg);
        },
        basic_qos: function () {
            return consumer.get_qos();
        }
    };
    this.unacked_msgs[consumer.get_id()] = [];
    this.consumers.push(c);

    this.maybe_deliver_message();
}

Queue.prototype.cancel_consumer = function (consumer_id) {
    for (var i = 0; i < this.consumers.length; i++) {
        if (this.consumers[i].id == consumer_id) {
            this.consumers.splice(i, 1);
            // move the consumer messages back to the queue.
            this.incr_msgs(this.unacked_msgs[consumer_id].length);
            this.decr_unacked_msgs(this.unacked_msgs[consumer_id].length);
            this.update_view_counters();
            delete this.unacked_msgs[consumer_id];
            break;
        }
    }
}

Queue.prototype.ack = function(consumer_id, msg_id, multi) {

    var len = this.unacked_msgs[consumer_id].length;
    var msg_id_found = false;
    var tmp = [];
    var acked = 0;

    for (var i = 0; i < len; i++) {
        if (this.unacked_msgs[consumer_id][i] == msg_id) {
            this.unacked_msgs[consumer_id].splice(i, 1);
            msg_id_found = true;
            acked++;
            break;
        } else {
            if (multi) {
                tmp.concat(this.unacked_msgs[consumer_id].splice(i, 1));
                acked++;
            }
        }
    }

    if (msg_id_found) {
        this.decr_unacked_msgs(acked);
        this.update_view_counters();
        this.maybe_deliver_message();
    } else {
        if (tmp.length > 0) {
            this.decr_unacked_msgs(acked);
            this.update_view_counters();
            this.unacked_msgs[consumer_id] = tmp;
        }
    }
}

Queue.prototype.make_msg_id = function() {
    return this.msg_id++;
}

Queue.prototype.make_consumer_id = function() {
    return this.consumer_id++;
}

function Consumer(name, uuid, delay, node) {
    this.name = name;
    this.delay = delay;
    this.qos = 0;
    this.queue = {};
    this.id = uuid;
    this.msgs = [];
    this.working = false;
    this.view = node;
    this.paused = true;
    this.credit = 0;
}

Consumer.prototype.pause = function() {
    console.log('consumer pause');
    this.paused = true;
}

Consumer.prototype.play = function() {
    console.log('consumer play');
    this.paused = false;
}

Consumer.prototype.grant_credit = function(c) {
    this.credit += c;
}

Consumer.prototype.get_view_node = function() {
    return this.view;
}

Consumer.prototype.get_qos = function() {
    return this.qos;
}

Consumer.prototype.set_qos = function(qos) {
    this.qos = qos;
}

Consumer.prototype.get_delay = function() {
    return this.delay;
}

Consumer.prototype.set_delay = function(delay) {
    this.delay = delay;
}

Consumer.prototype.get_msg_len = function() {
    return this.msgs.length;
}

Consumer.prototype.set_id = function (id) {
    this.id = id;
}

Consumer.prototype.get_id = function () {
    return this.id;
}

Consumer.prototype.subscribe = function(queue, qos) {
    var that = this;
    this.queue = queue;
    this.qos = qos;
    withProcessing(getProcessingSketchId(), function(pjs) {
        pjs.addConnection(that.get_view_node(), queue.get_view_node());
    });
    queue.add_consumer(this);
}

Consumer.prototype.handle_msg = function(msg) {
    this.get_view_node().incrQueuedMsgs(1);
    this.msgs.push(msg);

    console.log('handle_msg');

    if (!this.working) {
        this.process_next_msg();
    }
}

Consumer.prototype.process_next_msg = function() {
    console.log('process_next_msg', this.credit);
    if (queue_paused) {
        console.log('is paused', this.credit);
        if (this.credit < 1) {
            return;
        } else {
            this.credit--;
        }
    }

    if (this.msgs.length > 0) {
        this.working = true;
        var msg = this.msgs.shift();
        var that = this;
        window.setTimeout(function () {
            that.process_msg(msg);
        }, this.delay);
    } else {
        this.working = false;
    }
}

Consumer.prototype.process_msg = function(msg) {
    this.get_view_node().rotateConsumer();
    this.get_view_node().decrQueuedMsgs(1);
    this.queue.ack(this.get_id(), msg, false);
    // TODO see if next line is reached.
    this.process_next_msg();
}

var STAGE_WIDTH = 600;
var STAGE_HEIGHT = 410;
var QUEUE = 0;
var CONSUMER = 1;
var consumers = [];
var consumer_map = {};
var the_queue = null;
var queue_paused = true;

withProcessing(getProcessingSketchId(), function(pjs) {
    var ingres = 0;
    the_queue = new Queue(ingres, pjs.addNodeByType(QUEUE, ingres+"", STAGE_WIDTH/2, STAGE_HEIGHT/2));
});

function arrange_consumers() {
    var cx = STAGE_WIDTH/2;
    var cy = STAGE_HEIGHT/2;
    var c_number = consumers.length;
    var slice = 2 * Math.PI / c_number;

    for (var i = 0; i < c_number; i++) {
        consumers[i].get_view_node().setX(Math.cos(slice * i) * 150 + cx);
        consumers[i].get_view_node().setY(Math.sin(slice * i) * 150 + cy);
    }
}