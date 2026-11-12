var name = "Vũ Trọng Huy";
var MSSV = 31241022181;
document.write("Tôi tên là " + name + " - MSSV: " + MSSV + " sẽ quyết tâm trở thành 1 anh hùng JS.");
var level = 1;
var xp = 0;
var skillPoints = 5;
level++;
xp = 150 * (level - 1) + 200;
skillPoints = skillPoints + xp / 10;
document.write("</br>" + name + "</br>" + " Cấp độ hiện tại của bạn là " + level);
var strength = 0.6*skillPoints + 0.1*xp;
var agility = 0.2*skillPoints + 0.2*xp;
var intel = 0.6*skillPoints + 10*level;
document.write("</br>" + "LEVEL UP! Chúc mừng bạn lên cấp 3! XP +200");
level = 3;
xp = xp + 300;
var nhapTen = prompt("Hãy nhập tên bạn");
if(nhapTen == name){
    console.log("Chính xác! Bạn có trí nhớ rất tốt! intel+5!");
    intel = intel + 5;
} else {
    console.log("Tệ thật! Tên chính mình mà không nhớ sao?! intel -5!");
    intel = intel - 5;
}
var chonVai = prompt("Bạn muốn chọn phân cấp nào? a: Chiến Binh | b: Sát Thủ | c: Thợ Săn");
var phancap = "";
switch(chonVai){
    case "a":
        phancap = "Chiến Binh";
        strength = strength + 15;
        agility = agility - 10;
        intel = intel - 5;
        break;
    case "b":
        phancap = "Sát Thủ";
        strength = strength - 15;
        agility = agility + 10;
        intel = intel + 5;
        break;
    case "c":
        phancap = "Thợ Săn";
        strength = strength - 15;
        agility = agility + 10;
        intel = intel + 15;
        break;
}
document.write("</br>" + "LEVEL UP! Chúc mừng bạn lên cấp 4! XP +200");
level = 4;
xp = xp + 700;
/*========================================================
Trước khi vào trận chiến, cần xem lại các chỉ số của bạn
và xem xét các thông tin của đối thủ.
========================================================*/
level = 5; // Đảm bảo bạn sẽ ở cấp độ 5
var health = level + 100;// Khi lượng máu <= 0 thì bạn sẽ chết
console.log(strength); // Quyết định mức sát thương
console.log(agility); // Quyết định xác suất né đòn
console.log(intel); // Quyết định xác suất chí mạng
/*========================================================
Rồng Già
——–
Chậm chạp và yếu ớt hơn so với đồng loại, nhưng vẫn rất
nguy hiểm với khả năng phun lửa có thể gây sát thương chí
mạng rất cao
========================================================*/
var dragonHealth = 600;
var dragonStr = 100;
var dragonAgi = 15;
var dragonInt = 80;
var gameContinue = true;

var gameContinue = true;
while (gameContinue) {
    // Anh hùng tấn công!
    var heroHit = Math.random() * 100 > dragonAgi;
    if (heroHit) {
        dragonHealth = dragonHealth - strength;
        alert('TRẢM LONG! Bạn gây sát thương ' + strength + ' điểm cho Rồng!');
        var heroCritical = Math.random() * 100 < intel;
        if (heroCritical) {
            dragonHealth = dragonHealth - strength * 2; // Double damage
            alert('CHÍ MẠNG! Bạn gây sát thương chí mạng thêm ' + strength * 2 + ' điểm cho Rồng!');
        }
    } else alert('XÍ HỤT! Rồng đã lượn tránh được đòn tấn công của Bạn!');
    // Rồng tấn công!
    var dragonHit = Math.random() * 100 > agility;
    if (dragonHealth <= 0) {
        // Rồng lên bàn thờ
        gameContinue = false;
        alert('CHIẾN THẮNG!!! Chúc mừng bạn đã chiến thắng!!!');
    } else {
        if (dragonHit) {
            health = health - dragonStr;
            alert('HỎA CẦU! Rồng gây sát thương ' + dragonStr + ' điểm cho Bạn!');
            var dragonCritical = Math.random() * 100 < dragonInt;
            if (dragonCritical) {
                health = health - dragonStr * 2; // Double damage
                alert('CHÍ MẠNG! Rồng gây sát thương chí mạng thêm ' + dragonStr * 2 + ' điểm cho Bạn!');
            }
        } else alert('XÍ HỤT! Bạn đã tránh được đòn tấn công từ Rồng!');
    }
    // Kiểm tra xem Anh Hùng có bị nướng?!
    if (health <= 0) {
        gameContinue = false;
        alert('THẤT BẠI!!! Chúc mừng bạn đã có tên trên menu món tối của Rồng: Hiệp sĩ nướng lá lốt!');
    }
};
