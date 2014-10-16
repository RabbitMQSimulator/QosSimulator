// from http://stackoverflow.com/a/105074/342013
function GUID () {
    var S4 = function () {
        return Math.floor(
                Math.random() * 0x10000 /* 65536 */
            ).toString(16);
    };

    return (
            S4() + S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + S4() + S4()
        );
}

function randomNodeName() {
    return "sim.gen-" + jQuery.base64.encode(CryptoJS.MD5(GUID()).words.join()).substr(0, 12);
}


var withPTimeouts = {};

// convenience function to get the id attribute of generated sketch html element
function getProcessingSketchId () { return 'QosSimulator'; }

function getProcessing() {
    return Processing.getInstanceById(getProcessingSketchId());
}

function withProcessing() {
    var id = arguments[0];
    var callback = arguments[1];
    var args = Array.prototype.slice.call(arguments, 2);
    var pjs = Processing.getInstanceById(id);

    if (typeof withPTimeouts[id] != 'undefined') {
        clearTimeout(withPTimeouts[id]);
    }

    if(pjs != null) {
        args.unshift(pjs);
        callback.apply(null, args);
        return;
    }

    if (typeof withPTimeouts[id] == 'undefined') {
        var the_args = Array.prototype.slice.call(arguments);
        withPTimeouts[id] = setTimeout(function () {
            withProcessing.apply(null, the_args);
        }, 250);
    }
}

function pauseQueue() {
    if (the_queue != null) {
        queue_paused = the_queue.get_paused();
        the_queue.pause();
    }
}

function playQueue() {
    if (the_queue != null) {
        the_queue.play();
    }
}

function stopRendering(pjs) {
    console.log("stopRendering");
    pjs.stopRendering();
    pauseQueue();
}

function startRendering(pjs, pId) {
    console.log("startRendering");
    pjs.startRendering(pId);

    if (!queue_paused) {
        playQueue();
    }
}

function initSimulator(id) {
    jQuery(window).focus(function() {
        withProcessing(id, startRendering, id);
    });

    jQuery(window).blur(function() {
        withProcessing(id, stopRendering);
    });
}