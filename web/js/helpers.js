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

    playQueue();
}

function initSimulator(id) {
    jQuery(window).focus(function() {
        withProcessing(id, startRendering, id);
    });

    jQuery(window).blur(function() {
        withProcessing(id, stopRendering);
    });
}