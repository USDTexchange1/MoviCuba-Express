// ======== GLOBAL.JS ========

// ----- Función Toast -----
function mostrarToast(mensaje, tipo = "success") {
    const div = document.createElement("div");
    div.className = "toast " + tipo;
    div.innerText = mensaje;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ======== USUARIOS: REGISTRO E INICIO ========
const formRegistro = document.getElementById("formRegistro");
const formLogin = document.getElementById("formLogin");

if (formRegistro) {
    formRegistro.addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = formRegistro[0].value;
        const apellidos = formRegistro[1].value;
        const correo = formRegistro[2].value;
        const pass = formRegistro[3].value;

        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

        if (usuarios.find(u => u.correo === correo)) {
            mostrarToast("Este correo ya está registrado", "error");
            return;
        }

        usuarios.push({ nombre, apellidos, correo, pass });
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        mostrarToast("Registro exitoso");
        formRegistro.reset();
    });
}

if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const correo = formLogin[0].value;
        const pass = formLogin[1].value;
        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        const usuario = usuarios.find(u => u.correo === correo && u.pass === pass);
        if (usuario) {
            localStorage.setItem("usuarioActivo", JSON.stringify(usuario));
            mostrarToast("Bienvenido " + usuario.nombre);
            window.location.href = "panel.html";
        } else {
            mostrarToast("Correo o contraseña incorrectos", "error");
        }
    });
}

// ======== TIENDA ========
const productos = [
    { id: 1, nombre: "Moto Eléctrica X1", precio: 1200, img: "" },
    { id: 2, nombre: "Triciclo Eléctrico T2", precio: 1500, img: "" }
];

const contenedorProductos = document.getElementById("productos");

if (contenedorProductos) {
    productos.forEach(p => {
        const div = document.createElement("div");
        div.className = "producto";
        div.innerHTML = `
            <h3>${p.nombre}</h3>
            <p>$${p.precio}</p>
            <button onclick="agregarAlCarrito(${p.id})">Agregar al carrito</button>
        `;
        contenedorProductos.appendChild(div);
    });
}

// ======== CARRITO ========
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    const item = carrito.find(i => i.id === id);
    if (item) {
        item.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarToast("Producto agregado al carrito");
    renderCarrito();
}

function renderCarrito() {
    const lista = document.getElementById("listaCarrito");
    if (!lista) return;
    lista.innerHTML = "";
    let total = 0;
    carrito.forEach(item => {
        const div = document.createElement("div");
        div.innerHTML = `
            ${item.nombre} - $${item.precio} x ${item.cantidad}
            <button onclick="modificarCantidad(${item.id}, -1)">-</button>
            <button onclick="modificarCantidad(${item.id}, 1)">+</button>
            <button onclick="eliminarProducto(${item.id})">Eliminar</button>
        `;
        lista.appendChild(div);
        total += item.precio * item.cantidad;
    });
    const totalP = document.querySelector("#listaCarrito + p");
    if (totalP) totalP.textContent = "Total: $" + total;
}

function modificarCantidad(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad < 1) item.cantidad = 1;
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderCarrito();
}

function eliminarProducto(id) {
    carrito = carrito.filter(i => i.id !== id);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderCarrito();
}

document.addEventListener("DOMContentLoaded", renderCarrito);

// ======== WALLET ========
let saldo = parseFloat(localStorage.getItem("saldo")) || 0;

function actualizarSaldo() {
    const p = document.querySelector("#cartera p");
    if (p) p.textContent = "Saldo disponible: $" + saldo;
}

document.getElementById("recargarSaldo")?.addEventListener("click", () => {
    let cantidad = prompt("Ingrese cantidad a recargar:");
    if (!cantidad) return;
    cantidad = parseFloat(cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarToast("Cantidad inválida", "error");
        return;
    }
    // Generar código de validación (5 caracteres)
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let codigo = "";
    for (let i = 0; i < 5; i++) codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    localStorage.setItem("codigoRecarga", codigo);
    localStorage.setItem("cantidadRecarga", cantidad);
    // Abrir correo para enviar solicitud
    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo")) || {nombre:"", apellidos:""};
    window.location.href = `mailto:sobreruedas.cu@gmail.com?subject=Solicitud de recarga&body=Usuario:%20${usuarioActivo.nombre}%20${usuarioActivo.apellidos}%0ACantidad:%20${cantidad}%0ACódigo:%20${codigo}`;
    mostrarToast("Código de recarga enviado a su correo");
});

document.addEventListener("DOMContentLoaded", actualizarSaldo);

// ======== PAGO ========
const btnConfirmarPago = document.querySelector("button");

btnConfirmarPago?.addEventListener("click", () => {
    let total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    if (saldo < total) {
        mostrarToast("Saldo insuficiente", "error");
        return;
    }
    // Congelar saldo
    localStorage.setItem("saldoCongelado", total);
    saldo -= total;
    localStorage.setItem("saldo", saldo);
    localStorage.setItem("carrito", JSON.stringify([]));
    mostrarToast("Pago registrado, saldo congelado. Entrega en 72 horas");
    window.location.href = "panel.html";
});
