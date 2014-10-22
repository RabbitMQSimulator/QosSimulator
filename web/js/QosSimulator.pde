/***************************************************/
/***************************************************/
/***************************************************/
/***************************************************/
/***************************************************/

// From http://www.openprocessing.org/sketch/7029
/*
 * Draws a lines with arrows of the given angles at the ends.
 * x0 - starting x-coordinate of line
 * y0 - starting y-coordinate of line
 * x1 - ending x-coordinate of line
 * y1 - ending y-coordinate of line
 * startAngle - angle of arrow at start of line (in radians)
 * endAngle - angle of arrow at end of line (in radians)
 * solid - true for a solid arrow; false for an "open" arrow
 */
void arrowLine(float x0, float y0, float x1, float y1,
  float startAngle, float endAngle, boolean solid)
{
  line(x0, y0, x1, y1);
  if (startAngle != 0)
  {
    arrowhead(x0, y0, atan2(y1 - y0, x1 - x0), startAngle, solid);
  }
  if (endAngle != 0)
  {
    arrowhead(x1, y1, atan2(y0 - y1, x0 - x1), endAngle, solid);
  }
}

/*
 * Draws an arrow head at given location
 * x0 - arrow vertex x-coordinate
 * y0 - arrow vertex y-coordinate
 * lineAngle - angle of line leading to vertex (radians)
 * arrowAngle - angle between arrow and line (radians)
 * solid - true for a solid arrow, false for an "open" arrow
 */
void arrowhead(float x0, float y0, float lineAngle,
  float arrowAngle, boolean solid)
{
  float phi;
  float x2;
  float y2;
  float x3;
  float y3;
  final float SIZE = 8;

  x2 = x0 + SIZE * cos(lineAngle + arrowAngle);
  y2 = y0 + SIZE * sin(lineAngle + arrowAngle);
  x3 = x0 + SIZE * cos(lineAngle - arrowAngle);
  y3 = y0 + SIZE * sin(lineAngle - arrowAngle);
  if (solid)
  {
    triangle(x0, y0, x2, y2, x3, y3);
  }
  else
  {
    line(x0, y0, x2, y2);
    line(x0, y0, x3, y3);
  }
}
class Consumer extends Node implements IConnectable {
  int size = 5;
  int type = CONSUMER;
  float angle = 0;
  String name = null;
  String uuid = null;
  int queuedMessages = 0;

  Consumer(String label, float x, float y) {
    super(label, colors[CONSUMER], x, y);
  }

  int getType() {
    return type;
  }

  String getLabel() {
    return label + " msgs: " + str(queuedMessages);
  }

  String setUUID(id) {
      this.uuid = id;
  }

  void updateName(String name) {
      this.name = name;
  }

  void incrQueuedMsgs(int amount) {
      this.queuedMessages += amount;
  }

  void decrQueuedMsgs(int amount) {
      this.queuedMessages -= amount;
  }

  boolean accepts(Node n) {
    return false;
  }

  boolean canStartConnection() {
    return outgoing.size() < 1;
  }

  void trasnferArrived(Transfer transfer) {
    rotateConsumer();
  }

  void rotateConsumer() {
      this.angle += 0.2;
  }

  void draw() {
      ConsumerFigure.draw(this.x, this.y, this.nodeColor, 0, nodeStroke, this.radii, this.sides, this.angle);
      drawLabel();
  }

  void drawLabel() {
      fill (0);
      textAlign(CENTER, CENTER);
      if (y >= HEIGHT/2) {
          text(getLabel(), x, y+labelPadding);
      } else {
          text(getLabel(), x, y-labelPadding);
      }

  }

  void mouseClicked(boolean modifier) {
      if (modifier) {
          // process/ack message.
          process_message(this.uuid);
      } else {
          // init_consumer_form(this.uuid);
      }
  }
}
static class ConsumerFigure
{
    static void draw(float cx, float cy, color nodeColor, int strk, int nodeStroke, float radius, int sides, float angle) {
        fill(nodeColor);
        stroke(strk);
        strokeWeight(nodeStroke);
        ConsumerFigure.gear(8, 8, 10, cx, cy, PI/32, angle);
    }

    // based on http://www.local-guru.net/blog/2009/9/3/processing-gears
    static void gear( int tooth, int ri, int ro, float cx, float cy, float o, float angle) {
        pushMatrix();
        translate(cx, cy);
        rotate(angle);
        beginShape();
        for( int i = 0; i < tooth; i++ ) {
            vertex(cos(2*PI/tooth * i - o ) * ri, sin(2*PI/tooth*i - o) * ri);
            vertex(cos(2*PI/tooth * i + o ) * ro, sin(2*PI/tooth*i + o) * ro);
            vertex(cos(2*PI/(2*tooth) * (2*i+1) - o) * ro, sin(2*PI/(2*tooth)*(2*i+1) - o) * ro);
            vertex(cos(2*PI/(2*tooth) * (i*2+1) + o) * ri, sin(2*PI/(2*tooth)*(2*i+1) + o) * ri);
        }
        endShape(CLOSE);
        popMatrix();
    }
}
class Edge {
  Node from;
  Node to;
  color edgeColor;
  String bindingKeyLabel = DEFAULT_BINDING_KEY;
  float bkX, bkY;

  Edge(Node from, Node to, color edgeColor) {
    this.from = from;
    this.to = to;
    this.edgeColor = edgeColor;
  }

  float middleX() {
    return (from.x + to.x)/2;
  }

  float middleY() {
    return (from.y + to.y)/2;
  }

  void setBindingKey(String bk) {
    bindingKeyLabel = bk == "" ? DEFAULT_BINDING_KEY : bk;
  }

  String getBindingKey() {
    return bindingKeyLabel == DEFAULT_BINDING_KEY ? "" : bindingKeyLabel;
  }

  void remove() {
    Exchange x = (Exchange) to;
    x.removeBinding(from, getBindingKey());
  }

  boolean labelClicked() {
    float w = textWidth(bindingKeyLabel) / 2;
    return (mouseX >= middleX() - w && mouseX <= middleX() + w &&
            mouseY >= middleY() - 10 && mouseY <= middleY() + 10);
  }

  void draw() {

    stroke(this.edgeColor);
    strokeWeight(edgeStroke);
    line(from.x, from.y, to.x, to.y);

    drawArrowHead();
  }

  void drawArrowHead() {
    boolean atStart;
    float distance;

    switch(from.getType()) {
      case QUEUE:
      case CONSUMER:
      case EXCHANGE:
        atStart = true;
        distance = 0.1;
        break;
      default:
        atStart = false;
        distance = 0.9;
        break;
    }

    if (atStart) {
      float x0 = lerp(from.x, to.x, distance);
      float y0 = lerp(from.y, to.y, distance);
      float x1 = to.x;
      float y1 = to.y;
      arrowhead(x0, y0, atan2(y1 - y0, x1 - x0), radians(30), false);
    } else {
      float x0 = from.x;
      float y0 = from.y;
      float x1 = lerp(from.x, to.x, distance);
      float y1 = lerp(from.y, to.y, distance);
      arrowhead(x1, y1, atan2(y0 - y1, x0 - x1), radians(30), false);
    }
  }
}
interface IConnectable {
  boolean accepts(Node n);
}
abstract class Node {
  float x, y;
  int radii = 10;
  String label;
  color nodeColor;

  ArrayList incoming = new ArrayList(); // nodes that connected to this node
  ArrayList outgoing = new ArrayList(); // nodes this node connected to

  Node(String label, color nodeColor, float x, float y) {
     this.label = label;
     this.nodeColor = nodeColor;
     this.x = x;
     this.y = y;
  }

  abstract int getType();
  abstract boolean accepts(Node n);
  abstract boolean canStartConnection();

  String getLabel() {
    return label;
  }

  void setLabel(String _label) {
    this.label = _label;
  }

  float getX() {
    return x;
  }

  void setX(float _x) {
    this.x = _x;
  }

  float getY() {
    return y;
  }

  void setY(float _y) {
    this.y = _y;
  }

  boolean isBelowMouse() {
    float closest = 20;
    float d = dist(mouseX, mouseY, this.x, this.y);
    return d < closest;
  }

  /**
    endpoint DESTINATION | SOURCE specifies the role of the
    Node n.
  */
  void connectWith(Node n, int endpoint) {
    if (endpoint == DESTINATION) {
      this.addOutgoing(n);
    } else {
      this.addIncoming(n);
    }
  }

  void addIncoming(Node n) {
    incoming.add(n);
  }

  void addOutgoing(Node n) {
    outgoing.add(n);
  }

  void trasnferArrived(Transfer transfer) {
  }

  void transferDelivered(Transfer transfer) {
    println("transferDelivered");
  }

  /**
   * Padding from the simulator boundaries
   */
  int padding() {
    return this.radii * 2 + 2;
  }

  void mouseDragged() {
    x = constrain(mouseX, padding(), width - padding());
    y = constrain(mouseY, 0 + padding(), height - padding());
  }

  void draw() {
    NodeFigure.draw(this.x, this.y, this.nodeColor, 0, nodeStroke, this.radii)
    drawLabel();
  }

  void drawLabel() {
      fill (0);
      textAlign(CENTER, CENTER);
      text(getLabel(), x, y+labelPadding);
  }
}
static class NodeFigure
{
    static void draw(float x, float y, color nodeColor, int strk, int nodeStroke, int radii) {
        fill(nodeColor);
        stroke(strk);
        strokeWeight(nodeStroke);

        //draw node
        ellipse(x, y, radii * 2, radii * 2);
    }
}/* @pjs pauseOnBlur="true"; */

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
    target.mouseClicked(altOrShiftKeyPressed());
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
class Queue extends Node implements IConnectable {
  int type = QUEUE;
  ArrayList messages = new ArrayList();
  int msgs_number = 0;
  int unacked_number = 0;
  // Edge anonBinding;

  Queue(String name, float x, float y) {
    super(name, colors[QUEUE], x, y);
  }

  void setMsgsNumber(int n) {
      this.msgs_number = n;
  }

  void setUnackedNumber(int n) {
      this.unacked_number = n;
  }

  int getType() {
    return type;
  }

  boolean accepts(Node n) {
    return n.getType() == CONSUMER;
  }

  boolean canStartConnection() {
    return true;
  }

  // void setAnonBinding(Edge e) {
  //   anonBinding = e;
  // }

  Edge getAnonBinding() {
    return anonBinding;
  }

  void connectWith(Node n, int endpoint) {
    super.connectWith(n, endpoint);
    // maybeDeliverMessage();
  }

  void trasnferArrived(Transfer transfer) {
    enqueue(transfer);
    // maybeDeliverMessage();
  }

  void transferDelivered(Transfer transfer) {
    // incoming.add(transfer.getTo());
    // maybeDeliverMessage();
  }

  void enqueue(Transfer transfer) {
    messages.add(transfer);
  }

  Transfer dequeue() {
    return (Transfer) messages.remove(0);
  }

  void maybeDeliverMessage() {
    // if (messages.size() > 0) {
    //   if (incoming.size() > 0) {
    //     Node consumer = (Node) incoming.remove(0);
    //     Transfer transfer = dequeue();
    //     stage.addTransfer(new Transfer(stage, this, consumer, transfer.getData()));
    //   }
    // }
  }

  void changeName(String name) {
    this.label = name;
  }

  void draw() {
    QueueFigure.draw(this.x, this.y, this.nodeColor, 0, nodeStroke, Q_WIDTH, Q_HEIGHT, msgs_number);
    drawLabel();
  }

  void drawLabel() {
      fill (0);
      textAlign(LEFT, TOP);
      text("ingres: " + getLabel(), 10, 10);
      text("msgs: " + str(msgs_number), 10, 25);
      text("un-acked: " + str(unacked_number), 10, 40);
  }

  void mouseClicked(boolean modifier) {
      if (modifier) {
          deliver_message();
      } else {
          // init_queue_form();
      }
  }
}
static class QueueFigure
{
    static void draw(float x, float y, color nodeColor, int strk, int nodeStroke, int w, int h, int msgs) {
        fill(nodeColor);
        stroke(strk);
        strokeWeight(nodeStroke);
        rectMode(CENTER);
        rect(x, y, w, h, 2);
        rectMode(CORNER);

        QueueFigure.drawMessages(msgs, x, y, w, h);
    }

    static void drawMessages(int msgs, float x, float y, int w, int h) {
        strokeWeight(0.5);
        stroke(0);
        for (int i = 1; i <= msgs; i++) {
            if (i*2.5 > w) {
                break;
            }
            lx = x + (w/2) - (2 * i);
            hh = (h/2);
            line(lx, y - hh, lx, y + hh);
        }
    }
}

