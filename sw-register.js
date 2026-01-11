// ===========================================
// Service Worker Registration
// ===========================================

// دالة لتسجيل Service Worker
function registerServiceWorker() {
  // التحقق من دعم المتصفح لـ Service Worker
  if ('serviceWorker' in navigator) {
    console.log('[PWA] Service Worker مدعوم في هذا المتصفح');
    
    // انتظار تحميل الصفحة بالكامل
    window.addEventListener('load', () => {
      const swUrl = '/todo-app-enhanced/service-worker.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          // نجاح التسجيل
          console.log('[PWA] تم تسجيل Service Worker بنجاح:');
          console.log('[PWA] النطاق:', registration.scope);
          console.log('[PWA] الإصدار:', registration.active?.scriptURL || 'قيد التفعيل');
          
          // التحقق من وجود تحديثات
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            console.log('[PWA] تم العثور على Service Worker جديد');
            
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // يوجد Service Worker جديد متاح
                  console.log('[PWA] يوجد تحديث جديد متاح، يرجى إعادة تحميل الصفحة');
                  
                  // إظهار إشعار للمستخدم
                  showUpdateNotification();
                } else {
                  // تم التفعيل لأول مرة
                  console.log('[PWA] تم تفعيل Service Worker لأول مرة، التطبيق يعمل الآن بدون إنترنت');
                }
              }
            });
          });
        })
        .catch((error) => {
          // فشل التسجيل
          console.error('[PWA] فشل تسجيل Service Worker:', error);
        });
      
      // الاستماع للتغييرات في حالة الاتصال
      navigator.serviceWorker.ready.then((registration) => {
        console.log('[PWA] Service Worker جاهز للعمل');
        
        // الاستماع للرسائل من Service Worker
        registration.active?.postMessage({
          type: 'PING',
          timestamp: Date.now()
        });
      });
    });
  } else {
    console.warn('[PWA] Service Worker غير مدعوم في هذا المتصفح');
  }
}

// ===========================================
// دالة لإلغاء تسجيل Service Worker
// ===========================================
function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
          .then((success) => {
            if (success) {
              console.log('[PWA] تم إلغاء تسجيل Service Worker بنجاح');
            } else {
              console.log('[PWA] فشل في إلغاء التسجيل');
            }
          });
      })
      .catch((error) => {
        console.error('[PWA] خطأ في إلغاء التسجيل:', error);
      });
  }
}

// ===========================================
// دالة لإظهار إشعار التحديث
// ===========================================
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.id = 'pwa-update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <span class="update-icon">🔄</span>
      <span class="update-text">يتوفر تحديث جديد للتطبيق</span>
      <button class="update-btn" onclick="location.reload()">إعادة تحميل</button>
    </div>
  `;
  
  // إضافة الأنماط
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideUp 0.3s ease;
  `;
  
  // إضافة الأنماط الداخلية
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    .update-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .update-icon {
      font-size: 1.5rem;
    }
    .update-text {
      font-weight: bold;
    }
    .update-btn {
      background: white;
      color: #667eea;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: transform 0.2s;
    }
    .update-btn:hover {
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
}

// ===========================================
// دالة للتحقق من حالة التثبيت
// ===========================================
function checkInstallability() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // التحقق من إمكانية التثبيت
      if (registration.waiting) {
        console.log('[PWA] التطبيق جاهز للتثبيت');
      }
    });
  }
}

// ===========================================
// دالة لطلب التثبيت (للأجهزة التي لا تظهر الأتمتيكي)
// ===========================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  console.log('[PWA] طلب التثبيت متاح');
  
  // منع الإظهار الأوتوماتيكي
  event.preventDefault();
  
  // حفظ الطلب للاستخدام لاحقاً
  deferredPrompt = event;
  
  // إظهار زر التثبيت المخصص
  showInstallButton();
});

// دالة لإظهار زر التثبيت المخصص
function showInstallButton() {
  // التحقق من عدم ظهور الزر مسبقاً
  if (document.getElementById('pwa-install-btn')) {
    return;
  }
  
  const installBtn = document.createElement('button');
  installBtn.id = 'pwa-install-btn';
  installBtn.innerHTML = '📱 تثبيت التطبيق';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 5px 20px rgba(40, 167, 69, 0.4);
    z-index: 10000;
    animation: pulse 2s infinite;
  `;
  
  // إضافة الأنيميشن
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        transform: translateX(-50%) scale(1);
      }
      50% {
        transform: translateX(-50%) scale(1.05);
      }
    }
  `;
  document.head.appendChild(style);
  
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      // إظهار طلب التثبيت
      deferredPrompt.prompt();
      
      // انتظار اختيار المستخدم
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] نتيجة التثبيت:', outcome);
      
      // مسح الطلب
      deferredPrompt = null;
      
      // إخفاء الزر
      installBtn.remove();
    }
  });
  
  // إخفاء الزر عند التثبيت بنجاح
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] تم تثبيت التطبيق بنجاح');
    installBtn.remove();
    deferredPrompt = null;
    
    // إظهار رسالة شكر
    showNotification('شكراً لتثبيت التطبيق! 🎉', 'success');
  });
  
  document.body.appendChild(installBtn);
}

// ===========================================
// دالة لتفعيل وضع الـ Offline
// ===========================================
function enableOfflineMode() {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    console.log('[PWA] التطبيق يعمل في وضع الأوفلاين');
    showNotification('أنت الآن في وضع العمل بدون إنترنت 🌐', 'info');
  }
}

// ===========================================
// تصدير الدوال للاستخدام العام
// ===========================================
window.registerServiceWorker = registerServiceWorker;
window.unregisterServiceWorker = unregisterServiceWorker;
window.checkInstallability = checkInstallability;
window.enableOfflineMode = enableOfflineMode;
window.showInstallButton = showInstallButton;

// ===========================================
// التسجيل التلقائي عند تحميل الصفحة
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  checkInstallability();
});
