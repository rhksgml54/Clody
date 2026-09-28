from ultralytics import YOLO
import torch

def train_model():
    # 1. GPU 사용 가능 여부 확인
    if not torch.cuda.is_available():
        print("경고: NVIDIA GPU(CUDA)를 사용할 수 없습니다. 훈련이 매우 느려집니다.")
        print("NVIDIA 드라이버, CUDA Toolkit, PyTorch(GPU 버전) 설치를 확인하세요.")
        # GPU가 없으면 일단 CPU로라도 실행 (권장하지 않음)
        # return

    print("GPU(CUDA) 확인 완료. 훈련을 시작합니다.")

    # 2. YOLOv8 모델 로드 (처음 훈련 시)
    #    만약 훈련을 이어서 하려면, 'best.pt' 또는 'last.pt' 경로를 지정합니다.
    #    model = YOLO('runs/detect/train/weights/last.pt') # 예시
    model = YOLO('yolov8n.pt')  # 'nano' 모델로 새로 시작

    # 3. 훈련 실행
    print("로컬 훈련 시작... (이 훈련은 며칠이 걸릴 수 있으며, 중단되지 않습니다.)")
    results = model.train(
        data='data_local.yaml', # [중요] 로컬용 설정 파일 사용
        epochs=100,             # [중요] 100 에포크 전체 훈련
        imgsz=640,
        batch=16,               # [수정] 로컬 GPU 메모리(VRAM)에 따라 32, 16, 8 등으로 조절
        name='clody_local_run_1'
    )
    print("로컬 훈련 완료!")

if __name__ == '__main__':
    train_model()


