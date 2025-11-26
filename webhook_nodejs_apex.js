// Node.js Express webhook server for Apex
// Fill env vars in .env: BOT_TOKEN=8363385190:AAGwauwe-TK-_FwSNWdIbywkCvgsH_t3fx8, GROUP_ID=-1003243962325

import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

function saveSale(data){
  const file = path.join(process.cwd(),'sales.json');
  let arr=[];
  if(fs.existsSync(file)){
    arr = JSON.parse(fs.readFileSync(file));
  }
  arr.push({timestamp:Date.now(), data});
  fs.writeFileSync(file, JSON.stringify(arr,null,2));
}

function formatMessage(evt){
  const c = evt.customer||{};
  const t = evt.transaction||{};
  const msg = `🎉 Pagamento Aprovado!\n🆔 ID Cliente: ${c.chat_id||''}\n🔗 Username: ${c.username||''}\n👤 Nome de Perfil: ${c.profile_name||''}\n👤 Nome Completo: ${c.full_name||''}\n💳 CPF/CNPJ: ${c.tax_id||''}\n📦 Categoria: ${t.category||''}\n🎁 Plano: ${t.plan_name||''}\n📅 Duração: ${t.plan_duration||''}\n💰 Valor: R$ ${(t.plan_value/100).toFixed(2)}\n🔑 Transação Interna: ${t.internal_transaction_id||''}\n🏷️ Transação Gateway: ${t.external_transaction_id||''}\n💳 Método Pagamento: ${t.payment_method||''}\n🏦 Plataforma: ${t.payment_platform||''}`;
  return msg;
}

async function sendTelegram(msg){
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:GROUP_ID,text:msg})});
}

app.post('/webhook', async(req,res)=>{
  const body = req.body;
  if(body.event==='payment_approved'){
    saveSale(body);
    const message = formatMessage(body);
    await sendTelegram(message);
  }
  res.json({status:'ok'});
});

app.listen(3000, ()=>console.log('Webhook running'));
