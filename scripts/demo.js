require('dotenv').config({ quiet: true });
const base = `http://127.0.0.1:${process.env.PORT || 3006}/api`;
async function get(path) { const response = await fetch(base+path); if(!response.ok) throw new Error(`API no disponible: ${response.status}`); return response.json(); }
(async()=>{
    const [categories,suppliers,products] = await Promise.all([get('/categorias'),get('/proveedores'),get('/productos')]);
    if(!categories.length||!suppliers.length) throw new Error('Inicie primero la API con SEED_DEMO=true.');
    const examples = [
        { nombre:'Cuaderno A4', precio:12.5, stock:4, descripcion:'Material de oficina para el laboratorio.', categoria_id:categories.find(c=>c.nombre==='Oficina')?.id || categories[0].id },
        { nombre:'Monitor 24 pulgadas', precio:520, stock:12, descripcion:'Pantalla para estaciones de aprendizaje.', categoria_id:categories[0].id }
    ];
    for(const data of examples) {
        if(products.some(p=>p.nombre===data.nombre)) continue;
        const response=await fetch(base+'/productos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,proveedor_id:suppliers[0].id})});
        if(!response.ok) throw new Error(await response.text());
        console.log(`Creado: ${data.nombre}, stock ${data.stock}, entrada inicial registrada.`);
    }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
