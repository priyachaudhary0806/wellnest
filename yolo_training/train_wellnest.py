from ultralytics import YOLO

def main():
    print("Loading pretrained YOLO11n model...")
    model = YOLO("yolo11n.pt")

    print("Starting WellNest training test...")
    model.train(
        data="coco128.yaml",
        epochs=3,
        imgsz=320,
        batch=4,
        workers=0,
        device="cpu",
        project="runs/wellnest",
        name="training_test",
        exist_ok=True
    )

    print("Training test complete!")
    print("Check runs/wellnest/training_test/weights/best.pt")

if __name__ == "__main__":
    main()
