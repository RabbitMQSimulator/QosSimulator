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

  void mouseClicked() {
    // reset_form("#queue_form");
    // jQuery("#queue_id").val(this.label);
    // jQuery("#queue_name").val(this.label);
    // enable_form("#queue_form");
    // show_form("#queue_form");
  }
}
