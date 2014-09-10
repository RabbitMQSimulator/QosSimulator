function the_log(msg) {
    var current = $("#the_log").text();
    $("#the_log").text(current + "\n" + msg);
}

function Queue(name, node) {
    this.msg_id = 0;
    this.consumer_id = 0;
    this.name = name;
    this.consumers = [];
    this.messages = []; // messages queued to this queue
    this.unacked_msgs = {}; //unacked msgs
	
	this.view = node;
}

Queue.prototype.get_view_node = function() {
	return this.view;
}

Queue.prototype.enqueue = function(msg) {
    var m = {
        id: this.make_msg_id(),
        body: msg
    }
    this.messages.push(msg);
    this.maybe_deliver_message();
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
            var msg = this.messages.shift();
            if (msg) {
                this.move_msg_to_unacked(consumer.consumer.get_id(), msg);
                consumer.consumer.handle_msg(msg);
            } else {
                break;
            }
        }
        
        // rotate consumer position
        this.consumers.push(consumer);
    }
}

Queue.prototype.move_msg_to_unacked = function (consumer_id, msg) {
    this.unacked_msgs[consumer_id].push(msg);
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
            break;
        }
    }
}

Queue.prototype.ack = function(consumer_id, msg_id, multi) {
    var len = this.unacked_msgs[consumer_id].length;
    var msg_id_found = false;
    var tmp = [];
    
    for (var i = 0; i < len; i++) {
        if (this.unacked_msgs[consumer_id][i].id == msg_id) {
            this.unacked_msgs[consumer_id].splice(i, 1);
            msg_id_found = true;
            break;
        } else {
            if (multi) {
                tmp.concat(this.unacked_msgs[consumer_id].splice(i, 1));
            }
        }
    }
    
    if (msg_id_found) {
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
    var that = this;
    window.setTimeout(function () {
		that.get_view_node().rotateConsumer();
        that.queue.ack(that.get_id(), msg.id, false);
    }, this.delay);
}

Consumer.prototype.set_id = function (id) {
    this.id = id;
}

Consumer.prototype.get_id = function () {
    return this.id;
}

jQuery(document).ready(function() {
	withProcessing(getProcessingSketchId(), function(pjs) {
		var cx = 300;
		var cy = 205;
		var c_number = 10;
		slice = 2 * Math.PI / c_number;
		
		var q = new Queue("my_queue", pjs.addNodeByType(QUEUE, "my_queue", cx, cy));
	
		for (var i = 0; i < 1000; i++) {
		  q.enqueue("Hello World! " + i);
		}

		for (var i = 0; i < c_number; i++) {
		    var qos = Math.floor((Math.random() * 10) + 1);
			var c_name = "c id:" + i + " qos:" + qos;
			
			var new_x = Math.cos(slice * i) * 180 + cx;
			var new_y = Math.sin(slice * i) * 180 + cy;
			
		    var c = new Consumer(c_name, 1000, pjs.addNodeByType(CONSUMER, c_name, new_x, new_y));
		    c.subscribe(q, qos);
		}
	});
});