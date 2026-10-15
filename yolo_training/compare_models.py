from ultralytics import YOLO

image = "bus.jpg"

original = YOLO("yolo11n.pt")
trained = YOLO(r"runs\detect\runs\wellnest\training_test\weights\best.pt")

original.predict(
    source=image,
    imgsz=320,
    save=True,
    project="runs/compare",
    name="original",
    exist_ok=True
)

trained.predict(
    source=image,
    imgsz=320,
    save=True,
    project="runs/compare",
    name="trained",
    exist_ok=True
)

print("Original image: runs/compare/original/bus.jpg")
print("Trained image: runs/compare/trained/bus.jpg")
