const API = "http://localhost:4000";

async function load() {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API}/products`, {
        headers: { "Authorization": token }
    });

    const data = await res.json();

    const list = document.getElementById("list");
    list.innerHTML = "";

    if (!Array.isArray(data)) {
        list.innerHTML = `<tr><td colspan="5" style="color:red;">${data.error}</td></tr>`;
        return;
    }

    let totalItems = 0;
    let totalValue = 0;

    data.forEach(p => {
        totalItems += Number(p.quantity);
        totalValue += Number(p.quantity) * Number(p.price);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${p.name}</td>
            <td>${p.quantity}</td>
            <td>${p.price} ₽</td>
            <td>${p.quantity * p.price} ₽</td>
            <td><button onclick="removeProduct(${p.id})">❌</button></td>
        `;

        list.appendChild(row);
    });

    document.getElementById("count").innerText = data.length;
    document.getElementById("items").innerText = totalItems;
    document.getElementById("value").innerText = totalValue + " ₽";
}

async function addProduct() {
    const token = localStorage.getItem('token');

    const name = document.getElementById("name").value;
    const quantity = document.getElementById("quantity").value;
    const price = document.getElementById("price").value;

    if (!name || !quantity || !price) {
        alert("Заполни все поля");
        return;
    }

    await fetch(`${API}/products`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({
            name,
            quantity: Number(quantity),
            price: Number(price)
        })
    });

    document.getElementById("name").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("price").value = "";

    load();
}

async function removeProduct(id) {
    const token = localStorage.getItem('token');

    await fetch(`${API}/products/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": token
        }
    });

    load();
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
}

window.onload = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    load();
};