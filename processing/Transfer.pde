class Transfer {
  Stage stage;
  color fillColor;
  float x, y;
  int radii = 5;
  float distX, distY;
  float step = 0.02;
  float pct = 0.0;
  boolean finished = false;
  int data;
  Node from, to;

  Transfer(Stage stage, Node from, Node to, int data, color fillColor) {
    this.stage = stage;
    this.from = from;
    this.to = to;
    this.data = data;
    this.fillColor = fillColor;

    x = from.x;
    y = from.y;
    this.updateDist();
  }

  Message getData() {
    return data;
  }

  Node getFrom() {
    return from;
  }

  Node getTo() {
    return to;
  }

  boolean isFinished() {
    return finished;
  }

  void updateDist() {
    distX = to.x - from.x;
    distY = to.y - from.y;
  }

  void update() {
    updateDist();
    if (pct < 1.0) {
      this.x = from.x + (pct * distX);
      this.y = from.y + (pct * distY);
    }
  }

  void draw() {
    pct += step;
    fill(fillColor);
    ellipse(x, y, radii*2, radii*2);
  }

  void afterDraw() {
    if (pct >= 1.0) {
      finished = true;
      from.transferDelivered(this);
      to.transferArrived(this);
    }
  }
}
