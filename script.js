const orderForm = document.getElementById('orderForm');
const statusMsg = document.getElementById('status');

orderForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    const myUsername = 'shax255'; 

    // Qator tashlash uchun encodeURIComponent ichida to'g'ri ishlaydigan format
    const text = `🛍️ Yangi buyurtma saytdan!\n\n👤 Ism: ${name}\n📞 Tel: ${phone}\n💬 Izoh: ${message}`;
    
    const telegramUrl = `https://t.me/${myUsername}?text=${encodeURIComponent(text)}`;

    statusMsg.style.color = '#38bdf8';
    statusMsg.textContent = 'Telegramga oʻtilmoqda...';

    window.location.href = telegramUrl;
});