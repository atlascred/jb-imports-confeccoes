import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5173';
async function req(path,body,cookie=''){const r=await fetch(origin+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json',Origin:origin}),Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''}}
const email='qa-'+Date.now()+'@example.com';
const uploadedKeys=[];
try {
const catalog=await req('catalog');assert.equal(catalog.status,200);assert.equal(catalog.data.products.length,8);assert.equal(catalog.data.settings.minQuantity,10);
assert.equal((await req('admin')).status,401);
assert.equal((await req('login',{email:'admin@jbimports.com.br',password:'errada'})).status,401);
const c=await req('register',{name:'Cliente Teste Local',email,password:'Teste-local-12345'});assert.equal(c.status,200);assert.ok(c.cookie);
assert.equal((await req('admin',undefined,c.cookie)).status,403);assert.equal((await req('me',undefined,c.cookie)).data.user.email,email);
const product=catalog.data.products.find(p=>p.id==='camiseta-premium');const item={id:product.id,size:'M',color:'Preto',quantity:10,price:1};const customer={name:'Cliente Teste Local',phone:'11999999999',zip:'01001000',street:'Rua de Teste',number:'100',city:'São Paulo',state:'SP',neighborhood:'Centro'};
assert.equal((await req('orders',{items:[{...item,quantity:1}],customer},c.cookie)).status,400);
assert.equal((await req('orders',{items:[{...item,size:'INVALIDO'}],customer},c.cookie)).status,400);
assert.equal((await req('orders',{items:[{...item,quantity:999}],customer},c.cookie)).status,400);
assert.equal((await req('coupon',{code:'BEMVINDO10'})).data.percent,10);
const order=await req('orders',{items:[item],customer,coupon:'BEMVINDO10',total:1},c.cookie);assert.equal(order.status,201);assert.equal(order.data.total,22410);
assert.equal((await req('orders',undefined,c.cookie)).data.orders.length,1);
const password=process.env.ADMIN_PASSWORD;const admin=await req('login',{email:'admin@jbimports.com.br',password});assert.equal(admin.status,200);const dashboard=await req('admin',undefined,admin.cookie);assert.equal(dashboard.status,200);assert.ok(dashboard.data.orders.some(o=>o.id===order.data.id));
assert.equal((await req('admin/order',{id:order.data.id,status:'Confirmado'},admin.cookie)).status,200);assert.equal((await req('orders',undefined,c.cookie)).data.orders[0].status,'Confirmado');
assert.equal((await req('admin/coupon',{id:'QA10',percent:10,active:1},admin.cookie)).status,200);assert.equal((await req('coupon',{code:'QA10'})).data.percent,10);assert.equal((await req('admin/coupon',{id:'QA10',percent:10,active:0},admin.cookie)).status,200);assert.equal((await req('coupon',{code:'QA10'})).status,400);
assert.equal((await req('admin/product',{...product,stock:149},admin.cookie)).status,200);assert.equal((await req('catalog')).data.products.find(p=>p.id===product.id).stock,149);assert.equal((await req('admin/product',product,admin.cookie)).status,200);
assert.equal((await req('logout',{},c.cookie)).status,200);assert.equal((await req('me',undefined,c.cookie)).data.user,null);
const cross=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://invalid.example'},body:'{}'});assert.equal(cross.status,403);
const form=new FormData();form.set('image',new File([readFileSync('public/camiseta-preta.webp')],'produto.webp',{type:'image/webp'}));
const upload=await fetch(origin+'/api/upload',{method:'POST',headers:{Cookie:admin.cookie},body:form});assert.equal(upload.status,201);const uploaded=await upload.json();uploadedKeys.push('products/'+uploaded.url.split('/').at(-1));const picture=await fetch(origin+uploaded.url);assert.equal(picture.status,200);assert.equal(picture.headers.get('content-type'),'image/webp');
for(const path of ['/','/admin','/hero.webp','/logo.webp'])assert.equal((await fetch(origin+path)).status,200);
console.log('PASS: catálogo, autenticação, permissões, validações, preço no servidor, cupons, pedidos, estoque, fotos e páginas.');
} finally {
const {default:pg}=await import('pg');const ca=readFileSync('certs/supabase-ca.crt','utf8');const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{ca,rejectUnauthorized:true},max:1});const client=await pool.connect();
try {await client.query('BEGIN');await client.query('DELETE FROM jb_store.sessions WHERE "userId" IN (SELECT id FROM jb_store.users WHERE email=$1)',[email]);await client.query('DELETE FROM jb_store.orders WHERE "userId" IN (SELECT id FROM jb_store.users WHERE email=$1)',[email]);await client.query('DELETE FROM jb_store.users WHERE email=$1',[email]);await client.query('DELETE FROM jb_store.attempts WHERE id=$1',[email]);await client.query("DELETE FROM jb_store.coupons WHERE id='QA10'");for(const key of uploadedKeys)await client.query('DELETE FROM jb_store.product_images WHERE id=$1',[key]);await client.query('COMMIT');console.log('Dados temporários do teste removidos.');}catch(e){await client.query('ROLLBACK');throw e}finally{client.release();await pool.end()}
}
