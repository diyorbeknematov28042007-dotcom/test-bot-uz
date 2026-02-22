import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const bot = new Telegraf(process.env.8590338050:AAH5-osx-g1VpgtvcUogYJE5E7H2y-f8YSM);
const supabase = createClient(process.env.https://hjwjomkywxnijfxnrwdt.supabase.co, process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd2pvbWt5d3huaWpmeG5yd2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDc1NzEsImV4cCI6MjA4NTQyMzU3MX0.Yezqsbh0wku8svYkO4LPfibUuOhsVdSHKKqbzjahVoU);
const ADMIN_ID = process.env.6045817037; // Sizning ID raqamingiz
const GROUP_ID = process.env.-1003621378351; // Natijalar tashlanadigan guruh IDsi

bot.start(async (ctx) => {
    // Web App URL ni Vercel bergandan keyin o'zgartiramiz (masalan: https://loyihangiz.vercel.app)
    const webAppUrl = process.env.https://test-bot-uz.vercel.app/; 
    await ctx.reply("Assalomu alaykum. Testni boshlash uchun ilovani oching:", {
        reply_markup: {
            keyboard: [[{ text: "Test ishlash 📝", web_app: { url: webAppUrl } }]],
            resize_keyboard: true
        }
    });
});

// Admin funksiyasi: O'qituvchi qo'shish
bot.hears(/^\/add_teacher (\d+) (\d+)$/, async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return;
    const teacherId = ctx.match[1];
    const limit = parseInt(ctx.match[2]);

    await supabase.from('teachers').upsert({ id: teacherId, limit_count: limit });
    await ctx.reply(`O'qituvchi ${teacherId} ga ${limit} ta test limit berildi.`);
    bot.telegram.sendMessage(GROUP_ID, `Yangi o'qituvchiga ruxsat berildi! ID: ${teacherId}, Limit: ${limit}`);
});

// Web App dan ma'lumot kelganda qabul qilish (Testni tekshirish)
bot.on('web_app_data', async (ctx) => {
    const data = JSON.parse(ctx.message.web_app_data.data);
    const userId = ctx.from.id;
    
    // Bazadan testni qidirish
    const { data: testData } = await supabase.from('tests')
        .select('*').eq('code', data.testCode).eq('is_active', true).single();

    if (!testData) return ctx.reply("Ushbu kod bilan faol test topilmadi yoki vaqti tugagan.");

    // Foydalanuvchi oldin ishlaganligini tekshirish
    const { data: existRes } = await supabase.from('results')
        .select('*').eq('test_code', data.testCode).eq('user_id', userId).single();
    
    if (existRes) return ctx.reply("Siz bu testni avval ishlagansiz!");

    // Ballni hisoblash qismi
    let correctAnswers = testData.answers;
    let userAnswers = data.answers;
    let score = 0;
    let mistakes = [];

    for (let i = 0; i < Math.min(correctAnswers.length, userAnswers.length); i++) {
        if (correctAnswers[i] === userAnswers[i]) {
            if (data.gradeMode === 'umumiy') {
                score += 1;
            } else {
                if (i < 30) score += 1.1;
                else if (i < 60) score += 2.1;
                else score += 3.1;
            }
        } else {
            mistakes.push(`${i+1}-savol (Siz: ${userAnswers[i] || '-'} | To'g'ri: ${correctAnswers[i]})`);
        }
    }

    // Natijani bazaga saqlash
    await supabase.from('results').insert({
        test_code: data.testCode,
        user_id: userId,
        score: score,
        mistakes: mistakes.join('\n')
    });

    await ctx.reply(`Hurmatli ${data.fullName}, sizning natijangiz:\nTo'plagan balingiz: ${score.toFixed(1)}\nXatolar:\n${mistakes.join('\n')}`);
});

// Vercel ulanishi uchun Webhook sozlamasi
export default async function handler(req, res) {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot ishlayapti!');
    }
}
