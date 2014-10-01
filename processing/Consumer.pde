class Consumer extends Node implements IConnectable {
  int size = 5;
  int type = CONSUMER;
  float angle = 0;
  String name = null;
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

  void mouseClicked() {
      // reset_form("#edit_consumer_form");
      // jQuery("#edit_consumer_id").val(this.label);
      //
      // if (name != null) {
      //     jQuery("#edit_consumer_name").val(name);
      // } else {
      //     jQuery("#edit_consumer_name").val(label);
      // }
      //
      // enable_form("#edit_consumer_form");
      // show_form("#edit_consumer_form");
  }
}
