class WatermarkTool {
    constructor() {
        this.uploadedFiles = [];
        this.processedImages = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.watermarkText = document.getElementById('watermarkText');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.previewSection = document.getElementById('previewSection');
        this.previewGrid = document.getElementById('previewGrid');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.modal = document.getElementById('imageModal');
        this.modalImage = document.getElementById('modalImage');
        this.closeModal = document.querySelector('.close');
    }

    bindEvents() {
        // 上传区域点击事件
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // 文件选择事件
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // 拖拽事件
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 字体大小滑块事件
        this.fontSize.addEventListener('input', (e) => {
            this.fontSizeValue.textContent = e.target.value + 'px';
        });

        // 生成按钮事件
        this.generateBtn.addEventListener('click', () => {
            this.processImages();
        });

        // 下载所有按钮事件
        this.downloadAllBtn.addEventListener('click', () => {
            this.downloadAll();
        });
        
        // 清除按钮事件
        this.clearBtn.addEventListener('click', () => {
            this.clearAll();
        });

        // 模态框关闭事件
        this.closeModal.addEventListener('click', () => {
            this.modal.style.display = 'none';
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.modal.style.display = 'none';
            }
        });
    }

    handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) {
            alert('请选择有效的图片文件！');
            return;
        }

        this.uploadedFiles = [...this.uploadedFiles, ...imageFiles];
        
        // 启用生成按钮
        this.generateBtn.disabled = false;
    }

    async processImages() {
        this.previewGrid.innerHTML = '';
        this.processedImages = [];

        for (const file of this.uploadedFiles) {
            try {
                const processedImage = await this.addWatermark(file);
                this.processedImages.push({
                    file: file,
                    canvas: processedImage.canvas,
                    dataUrl: processedImage.dataUrl
                });
                this.addPreviewItem(file, processedImage.dataUrl);
            } catch (error) {
                console.error('处理图片失败:', error);
            }
        }

        this.previewSection.style.display = 'block';
    }

    addWatermark(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // 设置画布尺寸
                canvas.width = img.width;
                canvas.height = img.height;

                // 绘制原图
                ctx.drawImage(img, 0, 0);

                // 设置水印样式
                const fontSize = parseInt(this.fontSize.value);
                const text = this.watermarkText.value || '© 2024';
                
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';

                // 添加阴影效果
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.shadowBlur = 4;

                // 计算水印位置（右下角，留出边距）
                const margin = Math.max(20, fontSize * 0.5);
                const x = canvas.width - margin;
                const y = canvas.height - margin;

                // 绘制水印（先描边再填充，增强可读性）
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);

                // 转换为数据URL
                const dataUrl = canvas.toDataURL('image/png', 0.9);
                
                resolve({ canvas, dataUrl });
            };

            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };

            // 创建图片URL
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    addPreviewItem(file, dataUrl) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        previewItem.innerHTML = `
            <img src="${dataUrl}" alt="预览" class="preview-image">
            <div class="preview-info">
                <div class="preview-filename">${file.name}</div>
                <button class="download-btn" onclick="watermarkTool.downloadSingle('${file.name}')">下载此图片</button>
            </div>
        `;
        
        this.previewGrid.appendChild(previewItem);
        
        // 添加点击预览大图功能
        const previewImage = previewItem.querySelector('.preview-image');
        previewImage.addEventListener('click', () => {
            this.showImageModal(dataUrl);
        });
    }
    
    // 显示大图预览模态框
    showImageModal(imageUrl) {
        this.modalImage.src = imageUrl;
        this.modal.style.display = 'block';
    }

    // 清除所有已上传的图片
    clearAll() {
        this.uploadedFiles = [];
        this.processedImages = [];
        this.previewGrid.innerHTML = '';
        this.previewSection.style.display = 'none';
        this.generateBtn.disabled = true;
    }

    downloadSingle(filename) {
        const processedImage = this.processedImages.find(img => img.file.name === filename);
        if (processedImage) {
            this.downloadImage(processedImage.dataUrl, this.getWatermarkedFilename(filename));
        }
    }

    downloadAll() {
        if (this.processedImages.length === 0) {
            alert('没有可下载的图片！');
            return;
        }

        this.processedImages.forEach(processedImage => {
            const filename = this.getWatermarkedFilename(processedImage.file.name);
            this.downloadImage(processedImage.dataUrl, filename);
        });
    }

    downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getWatermarkedFilename(originalFilename) {
        const lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return originalFilename + '_watermarked';
        }
        
        const name = originalFilename.substring(0, lastDotIndex);
        const extension = originalFilename.substring(lastDotIndex);
        return `${name}_watermarked${extension}`;
    }
}

// 初始化应用
const watermarkTool = new WatermarkTool();

// 防止页面默认的拖拽行为
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});