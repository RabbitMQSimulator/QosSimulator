/* @pjs pauseOnBlur="true"; */

int nodeCount;
Node[] nodes = new Node[100];

// TODO see how to keep track of Exchanges vs. Queues, etc. since the names may collide
// maybe use names like str(n.getType()) + n.getLabel())
HashMap nodeTable = new HashMap();

ArrayList edges = new ArrayList();

// use to track interactions between objects
Node tmpNode;
Node from;
Node to;

static final int WIDTH = 600;
static final int HEIGHT = 410;

static final int edgeStroke = 2;
static final int nodeStroke = 2;
static final int labelPadding = 20;

static final color nodeColor   = #F0C070;
static final color selectColor = #FF3030;
static final color fixedColor  = #FF8080;
static final color edgeColor   = #000000;

static final int QUEUE = 0;
static final int CONSUMER = 1;

static final int SOURCE = 0;
static final int DESTINATION = 1;

static final String DEFAULT_BINDING_KEY = "binding key";

static final int Q_HEIGHT = 15;
static final int Q_WIDTH = 20;

color[] colors = new color[20];

String[] nodeTypes = new String[2];

PFont font;
static final int fontSize = 14;

void bindJavascript(JavaScript js) {
  javascript = js;
}

JavaScript javascript;

void setup() {
  Processing.logger = console;

  size(600, 410);
  font = createFont("SansSerif", fontSize);
  textFont(font);
  smooth();

  colors[QUEUE] = #42C0FB;
  colors[CONSUMER] = #E1FF08;

  nodeTypes[QUEUE] = "queue";
  nodeTypes[CONSUMER] = "consumer";
}

String nodeTypeToString(int type) {
  return nodeTypes[type];
}

Nodes[] getNodes() {
  return nodes;
}

Edge addEdge(Node from, Node to) {
  for (int i = edges.size()-1; i >= 0; i--) {
    Edge et = (Edge) edges.get(i);
    if ((et.from == from && et.to == to) ||
        (et.to == from && et.from == to)) {
      return null;
    }
  }

  Edge e = new Edge(from, to, edgeColor);
  edges.add(e);
  return e;
}

Node newNodeByType(int type, String label, float x, float y) {
  Node n = null;
  switch (type) {
    case QUEUE:
      n = new Queue(label, x, y);
      break;
    case CONSUMER:
      n = new Consumer(label, x, y);
      break;
    default:
      println("Unknown type");
      break;
  }
  return n;
}

Node addNodeByType(int type, String label, float x, float y) {
  Node n = newNodeByType(type, label, x, y);

  if (n != null) {
      if (nodeCount == nodes.length) {
        nodes = (Node[]) expand(nodes);
      }

      console.log(label);
      nodeTable.put(label, n);
      nodes[nodeCount++] = n;
  }

  return n;
}

Node findNode(String label) {
  return nodeTable.get(label);
}

void stopRendering() {
    noLoop();
}

/**
 * restoreProducers requires the sketch id to pass back to javascript
 * hackish as hackish can be
 */
void startRendering(String pId) {
    loop();
}

Node changeNodeName(String oldName, String name) {
  Node n = findNode(oldName);
  n.changeName(name);
  nodeTable.remove(oldName);
  nodeTable.put(name, n);
  return n;
}

void editQueue(String oldName, String name) {
  if (name == "") {
    return;
  }

  Node n = changeNodeName(oldName, name);
}

void editConsumer(String uuid, String name) {
    Consumer n = (Consumer) findNode(uuid);
    n.updateName(name);
}

void draw() {
  background(255);

  stroke(0);
  strokeWeight(2);
  noFill();
  rect(0, 0, WIDTH, HEIGHT);

  for (int i = 0 ; i < nodeCount ; i++) {
    nodes[i].draw();
  }

  for (int i = edges.size()-1; i >= 0; i--) {
    Edge e = (Edge) edges.get(i);
    e.draw();
  }

  if (tmpNode != null) {
    tmpNode.draw();
  }
}

Node nodeBelowMouse() {
  for (int i = 0; i < nodeCount; i++) {
    Node n = nodes[i];
    if (n.isBelowMouse()) {
      return n;
    }
  }

  return null;
}

void mouseClicked() {
  Node target = nodeBelowMouse();

  if (target != null) {
    target.mouseClicked();
  }
}

void mousePressed() {
  from = nodeBelowMouse();
}

boolean altOrShiftKeyPressed() {
  return keyPressed && key == CODED && (keyCode == ALT || keyCode == SHIFT);
}

void mouseDragged() {
  if (from != null) {
      from.mouseDragged();
  }

  if (tmpNode != null) {
    tmpNode.mouseDragged();
  }
}

Edge addConnection(Node from, Node to) {
  Edge e = addEdge(from, to);
  if (e != null) {
    // DESTINATION & SOURCE refer to the drag & drop source & dest, not RabbitMQ concepts
    from.connectWith(to, DESTINATION);
    to.connectWith(from, SOURCE);
  } else {
     println("addEdge false");
  }
  return e;
}
