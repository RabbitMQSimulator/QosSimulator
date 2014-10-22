class Queue extends Node implements IConnectable {
  int type = QUEUE;
  int msgs_number = 0;
  int unacked_number = 0;

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

  Edge getAnonBinding() {
    return anonBinding;
  }

  void connectWith(Node n, int endpoint) {
    super.connectWith(n, endpoint);
  }

  void transferMsg(Consumer c, int msg_id) {
      stage.addTransfer(new Transfer(stage, this, c, msg_id, tMsgColor));
  }

  /**
   * An ack arrived form the consumer
   **/
  void transferArrived(Transfer transfer) {
  }

  /**
   * The transfer reached the consumer
   **/
  void transferDelivered(Transfer transfer) {
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
      // if (modifier) {
          deliver_message();
      // } else {
      //     // init_queue_form();
      // }
  }
}
