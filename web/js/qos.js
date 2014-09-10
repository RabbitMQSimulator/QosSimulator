var STAGE_WIDTH = 600; 
var STAGE_HEIGHT = 410;

function the_log(msg) {
    var current = $("#the_log").text();
    $("#the_log").text(current + "\n" + msg);
}

function Queue(name, node) {
    this.msg_id = 0;
    this.consumer_id = 0;
    this.name = name;
    this.consumers = [];
    this.messages = 0; // messages queued to this queue
    this.unacked_msgs = {}; //unacked msgs
	this.unacked_count = 0;
	
	this.view = node;
}

Queue.prototype.get_view_node = function() {
	return this.view;
}

Queue.prototype.update_view_counters = function() {
	this.get_view_node().setMsgsNumber(this.messages);
	this.get_view_node().setUnackedNumber(this.unacked_count);
}

Queue.prototype.enqueue = function(amount) {
	this.messages += amount;
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
    var consumer = this.consumers.shift();
    
    if (consumer) {
        var qos = consumer.basic_qos;
        the_log("maybe_deliver_message: " + 
                consumer.consumer.name + " : " + 
                qos + " : " +  
                this.unacked_msgs[consumer.consumer.get_id()].length);
                
        while (qos == 0 || qos > this.unacked_msgs[consumer.consumer.get_id()].length) {
            if (this.messages > 0) {
				var msg_id = this.make_msg_id();
                this.move_msg_to_unacked(consumer.consumer.get_id(), msg_id);
				this.decr_msgs(1);
				this.update_view_counters();
                consumer.consumer.handle_msg(msg_id);
            } else {
                break;
            }
        }
        
        // rotate consumer position
        this.consumers.push(consumer);
    }
}

Queue.prototype.move_msg_to_unacked = function (consumer_id, msg_id) {
    this.unacked_msgs[consumer_id].push(msg_id);
	this.incr_unacked_msgs(1);
	this.update_view_counters();
}

Queue.prototype.add_consumer = function(consumer, basic_qos) {
    var new_id = this.make_consumer_id();
    var c = {
        id: new_id,
        consumer: consumer, 
        basic_qos: basic_qos
    };
    this.unacked_msgs[new_id] = [];
    this.consumers.push(c);
    consumer.set_id(new_id);
    
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
        if (this.unacked_msgs[consumer_id][i].id == msg_id) {
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
        this.unacked_msgs[consumer_id] = tmp;
    }
}

Queue.prototype.make_msg_id = function() {
    return this.msg_id++;
}

Queue.prototype.make_consumer_id = function() {
    return this.consumer_id++;
}

function Consumer(name, delay, node) {
    this.name = name;
    this.delay = delay;
    this.queue = {};
    this.id = "";
	
	this.view = node;
}

Consumer.prototype.get_view_node = function() {
	return this.view;
}

Consumer.prototype.subscribe = function(queue, qos) {
	var that = this;
    this.queue = queue;
	withProcessing(getProcessingSketchId(), function(pjs) {
		pjs.addConnection(that.get_view_node(), queue.get_view_node());
	});
    queue.add_consumer(this, qos);
}

Consumer.prototype.handle_msg = function(msg) {
    the_log("handle_msg: " + this.name + " : " + msg);
	
	this.get_view_node().incrQueuedMsgs(1);
	
    var that = this;
    window.setTimeout(function () {
		that.get_view_node().rotateConsumer();
		that.get_view_node().decrQueuedMsgs(1);
        that.queue.ack(that.get_id(), msg.id, false);
    }, this.delay);
}

Consumer.prototype.set_id = function (id) {
    this.id = id;
}

Consumer.prototype.get_id = function () {
    return this.id;
}


var consumers = [];

function arrange_consumers() {
	var cx = STAGE_WIDTH/2;
	var cy = STAGE_HEIGHT/2;
	var c_number = consumers.length;
	var slice = 2 * Math.PI / c_number;
	
	console.log("arrange_consumers", c_number);
	
	for (var i = 0; i < c_number; i++) {
		consumers[i].get_view_node().setX(Math.cos(slice * i) * 180 + cx);
		consumers[i].get_view_node().setY(Math.sin(slice * i) * 180 + cy);
	}
}

jQuery(document).ready(function() {
	withProcessing(getProcessingSketchId(), function(pjs) {

		var c_number = Math.floor((Math.random() * 10) + 1);
		
		var q = new Queue("1000", pjs.addNodeByType(QUEUE, "my_queue", STAGE_WIDTH/2, STAGE_HEIGHT/2));
	
		q.enqueue(1000);

		for (var i = 0; i < c_number; i++) {
		    var qos = Math.floor((Math.random() * 10) + 1);
			var c_name = "qos:" + qos;
		    var c = new Consumer(c_name, 1000, pjs.addNodeByType(CONSUMER, c_name, -50, -50));
			consumers.push(c);
			arrange_consumers();
		    c.subscribe(q, qos);
		}
	});
});