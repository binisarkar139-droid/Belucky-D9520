// ======================================================
// beLucky ADMIN PANEL
// ======================================================

import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ======================================================
// STORAGE KEYS
// ======================================================

const K = {
    users: "a66aUsers",
    lotteries: "a66aLotteries",
    tickets: "a66aTickets",
    settings: "a66aSettings",
    notifications: "a66aNotifications"
};


// ======================================================
// DEFAULT PRODUCTS
// ======================================================

const defaults = [
    {
        id: "phone17",
        name: "Premium Phone",
        price: "Sandbox",
        prize: "Premium Smartphone",
        description: "Sample prize product.",
        image:
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
        total: 100,
        status: "active"
    },

    {
        id: "gaming",
        name: "Gaming Setup",
        price: "Sandbox",
        prize: "Gaming Setup",
        description: "Sample gaming product.",
        image:
            "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80",
        total: 100,
        status: "active"
    },

    {
        id: "travel",
        name: "Travel Package",
        price: "Sandbox",
        prize: "Travel Package",
        description: "Sample travel product.",
        image:
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
        total: 100,
        status: "active"
    }
];


// ======================================================
// LOCAL STORAGE HELPERS
// ======================================================

const get = (key, fallback = []) => {

    try {

        const value =
            localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);

    } catch {

        return fallback;
    }
};


const put = (key, value) => {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
};


// ======================================================
// HTML ESCAPE
// ======================================================

const esc = (value) => {

    return String(value ?? "").replace(
        /[&<>"']/g,
        (match) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[match]
    );
};


// ======================================================
// PRODUCTS
// ======================================================

const ls = () => {

    const lotteries =
        get(K.lotteries, []);

    return Array.isArray(lotteries)
        ? lotteries
        : [];
};

async function getFirestoreLotteries() {

    try {

        if (!window.firebaseDB) {
            console.error("Firebase Firestore not initialized.");
            return [];
        }

        const snapshot = await getDocs(
            collection(
                window.firebaseDB,
                "a66aLotteries"
            )
        );

        return snapshot.docs.map(firebaseDoc => ({
            id: firebaseDoc.id,
            ...firebaseDoc.data()
        }));

    } catch (error) {

        console.error(
            "Firestore products error:",
            error
        );

        return [];
    }
}

// ======================================================
// TICKETS
// ======================================================

const ts = () => {

    const tickets =
        get(K.tickets, []);

    return Array.isArray(tickets)
        ? tickets
        : [];
};


// ======================================================
// LOCAL USERS
// ======================================================

const us = () => {

    const users =
        get(K.users, []);

    return Array.isArray(users)
        ? users
        : [];
};


// ======================================================
// GENERATE TICKET NUMBERS
// ======================================================

const nums = (count) => {

    const total =
        Number(count) || 0;

    return Array.from(
        { length: total },
        (_, index) =>
            "B" +
            String(
                1000000000 + index
            ).padStart(10, "0")
    );
};


// ======================================================
// PRODUCT TICKETS
// ======================================================

const pt = (lotteryId) => {

    return ts().filter(
        ticket =>
            String(ticket.lotteryId) ===
            String(lotteryId)
    );
};


// ======================================================
// FIRESTORE USERS
// ======================================================

async function getFirestoreUsers() {

    try {

        if (!window.firebaseDB) {

            console.error(
                "Firebase Firestore not initialized."
            );

            return us();
        }


        const snapshot =
            await getDocs(
                collection(
                    window.firebaseDB,
                    "a66aUsers"
                )
            );


        const users =
            snapshot.docs.map(
                firebaseDoc => {

                    const data =
                        firebaseDoc.data() || {};

                    return {

                        ...data,

                        firebaseDocId:
                            firebaseDoc.id,

                        firebaseUid:
                            data.firebaseUid ||
                            firebaseDoc.id
                    };
                }
            );


        // Sync users locally
        put(
            K.users,
            users
        );


        return users;

    } catch (error) {

        console.error(
            "Firestore users error:",
            error
        );

        return us();
    }
}


// ======================================================
// FIND USER
// ======================================================

async function findUser(id) {

    if (!id) {
        return null;
    }


    const users =
        await getFirestoreUsers();


    return (
        users.find(
            user =>
                String(user.id) ===
                String(id)
        ) ||

        users.find(
            user =>
                String(user.firebaseUid) ===
                String(id)
        ) ||

        users.find(
            user =>
                String(user.firebaseDocId) ===
                String(id)
        ) ||

        null
    );
}


// ======================================================
// USER PURCHASES
// ======================================================

function userTickets(user) {

    if (!user) {
        return [];
    }


    const ids = [
        user.id,
        user.firebaseUid,
        user.firebaseDocId
    ]
        .filter(Boolean)
        .map(String);


    return ts().filter(ticket => {

        if (!ticket.userId) {
            return false;
        }


        return ids.includes(
            String(ticket.userId)
        );
    });
}


// ======================================================
// DASHBOARD
// ======================================================

async function renderDashboard() {

    const stats =
        document.getElementById(
            "stats"
        );

    const recent =
        document.getElementById(
            "recent"
        );


    if (!stats || !recent) {
        return;
    }


    const lotteries =
        ls();

    const tickets =
        ts();

    const users =
        await getFirestoreUsers();


    stats.innerHTML = `

        <div class="stat">

            <strong>
                ${lotteries.length}
            </strong>

            <span>
                Products
            </span>

        </div>


        <div class="stat">

            <strong>
                ${users.length}
            </strong>

            <span>
                Users
            </span>

        </div>


        <div class="stat">

            <strong>
                ${tickets.length}
            </strong>

            <span>
                Purchases
            </span>

        </div>

    `;


    if (!tickets.length) {

        recent.innerHTML = `

            <p class="muted">
                No purchases yet.
            </p>

        `;

        return;
    }


    const recentTickets =
        [...tickets]
            .reverse()
            .slice(0, 8);


    recent.innerHTML =
        recentTickets
            .map(ticket => {

                const lottery =
                    lotteries.find(
                        lottery =>
                            String(
                                lottery.id
                            ) ===
                            String(
                                ticket.lotteryId
                            )
                    );


                return `

                    <div>

                        <strong>
                            ${esc(
                                ticket.number ||
                                ticket.ticketNumber ||
                                "Ticket"
                            )}
                        </strong>

                        <span>
                            ${esc(
                                lottery?.name ||
                                "Unknown Product"
                            )}
                        </span>

                    </div>

                `;

            })
            .join("");
}


// ======================================================
// PRODUCTS
// ======================================================

function renderProducts() {

    const box =
        document.getElementById(
            "productAdmin"
        );


    if (!box) {
        return;
    }


    const lotteries =
        ls();


    if (!lotteries.length) {

        box.innerHTML = `

            <p class="muted">
                No products available.
            </p>

        `;

        return;
    }


    box.innerHTML =
        lotteries
            .map(lottery => {

                const tickets =
                    pt(lottery.id);


                const sold =
                    tickets.length;


                const total =
                    Number(lottery.total) || 0;


                const unsold =
                    Math.max(
                        0,
                        total - sold
                    );


                const percent =
                    total > 0
                        ? Math.min(
                            100,
                            Math.round(
                                (
                                    sold /
                                    total
                                ) * 100
                            )
                        )
                        : 0;


                return `

                    <div class="admin-card">

                        ${
                            lottery.image
                                ? `
                                    <img
                                        src="${esc(
                                            lottery.image
                                        )}"
                                        alt="${esc(
                                            lottery.name
                                        )}"
                                        style="
                                            width:100%;
                                            height:170px;
                                            object-fit:cover;
                                            border-radius:12px;
                                            margin-bottom:14px;
                                        "
                                    >
                                `
                                : ""
                        }


                        <h3>
                            ${esc(
                                lottery.name
                            )}
                        </h3>


                        <p class="muted">
                            ${esc(
                                lottery.prize ||
                                ""
                            )}
                        </p>


                        <p>
                            Price:
                            ${esc(
                                lottery.price ||
                                "Sandbox"
                            )}
                        </p>


                        <p>
                            Sold:
                            <strong>
                                ${sold}
                            </strong>
                            /
                            ${total}
                        </p>


                        <p class="muted">
                            Unsold:
                            ${unsold}
                        </p>


                        <div class="progress">

                            <span
                                style="
                                    width:${percent}%;
                                "
                            ></span>

                        </div>


                        <p class="muted">
                            ${percent}% sold
                        </p>


                        <p>
                            Status:
                            <strong>
                                ${esc(
                                    lottery.status ||
                                    "active"
                                )}
                            </strong>
                        </p>


                        <div class="actions">

                            <button
                                class="smallbtn"
                                type="button"
                                onclick="editProduct('${esc(
                                    lottery.id
                                )}')"
                            >
                                Edit
                            </button>


                            <button
                                class="smallbtn"
                                type="button"
                                onclick="toggleProduct('${esc(
                                    lottery.id
                                )}')"
                            >
                                ${
                                    lottery.status ===
                                    "paused"
                                        ? "Activate"
                                        : "Pause"
                                }
                            </button>


                            <button
                                class="smallbtn"
                                type="button"
                                onclick="deleteProduct('${esc(
                                    lottery.id
                                )}')"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `;

            })
            .join("");
}


// ======================================================
// EDIT PRODUCT
// ======================================================

function editProduct(id) {

    openModal(id);
}


// ======================================================
// TOGGLE PRODUCT
// ======================================================

function toggleProduct(id) {

    const lotteries =
        ls();


    const product =
        lotteries.find(
            lottery =>
                String(lottery.id) ===
                String(id)
        );


    if (!product) {
        return;
    }


    product.status =
        product.status === "paused"
            ? "active"
            : "paused";


    put(
        K.lotteries,
        lotteries
    );


    renderAll();
}


// ======================================================
// DELETE PRODUCT
// ======================================================

function deleteProduct(id) {

    const lotteries =
        ls();


    const productIndex =
        lotteries.findIndex(
            lottery =>
                String(lottery.id) ===
                String(id)
        );


    if (productIndex === -1) {
        return;
    }


    const product =
        lotteries[productIndex];


    const ok =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!ok) {
        return;
    }


    // Sirf ek product delete hoga
    lotteries.splice(
        productIndex,
        1
    );


    put(
        K.lotteries,
        lotteries
    );


    renderAll();
}

// ======================================================
// PRODUCT MODAL
// ======================================================

function openModal(id = "") {

    const modal =
        document.getElementById(
            "modal"
        );


    if (!modal) {
        return;
    }


    const title =
        document.getElementById(
            "modalTitle"
        );

    const productId =
        document.getElementById(
            "productId"
        );

    const pName =
        document.getElementById(
            "pName"
        );

    const pPrice =
        document.getElementById(
            "pPrice"
        );

    const pPrize =
        document.getElementById(
            "pPrize"
        );

    const pDesc =
        document.getElementById(
            "pDesc"
        );

    const pImage =
        document.getElementById(
            "pImage"
        );

    const pTotal =
        document.getElementById(
            "pTotal"
        );

    const pStatus =
        document.getElementById(
            "pStatus"
        );


    if (!id) {

        title.textContent =
            "New Product";

        productId.value = "";
        pName.value = "";
        pPrice.value = "Sandbox";
        pPrize.value = "";
        pDesc.value = "";
        pImage.value = "";
        pTotal.value = 100;
        pStatus.value = "active";

    } else {

        const product =
            ls().find(
                lottery =>
                    String(lottery.id) ===
                    String(id)
            );


        if (!product) {
            return;
        }


        title.textContent =
            "Edit Product";


        productId.value =
            product.id;


        pName.value =
            product.name || "";


        pPrice.value =
            product.price || "";


        pPrize.value =
            product.prize || "";


        pDesc.value =
            product.description || "";


        pImage.value =
            product.image || "";


        pTotal.value =
            product.total || 100;


        pStatus.value =
            product.status || "active";
    }


    // IMPORTANT:
    // Do not use hidden class here.
    // CSS already controls modal display.

    modal.classList.add("show");
}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    const modal =
        document.getElementById(
            "modal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );
}


// ======================================================
// SAVE PRODUCT
// ======================================================

async function saveProduct(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "productId"
        ).value.trim();


    const name =
        document.getElementById(
            "pName"
        ).value.trim();


    const price =
        document.getElementById(
            "pPrice"
        ).value.trim();


    const prize =
        document.getElementById(
            "pPrize"
        ).value.trim();


    const description =
        document.getElementById(
            "pDesc"
        ).value.trim();


    const image =
        document.getElementById(
            "pImage"
        ).value.trim();


    const total =
        Math.max(
            1,
            Number(
                document.getElementById(
                    "pTotal"
                ).value
            ) || 100
        );


    const status =
        document.getElementById(
            "pStatus"
        ).value;


    if (!name || !prize) {

        alert(
            "Product name and prize are required."
        );

        return;
    }

    const lotteries = ls();
    const productId = id || "lottery_" + Date.now();
    const product = {
        
        id: productId,
        name,
        price,
        prize,
        description,
        image,
        total,
        status
    };   

    try {

    if (!window.firebaseDB) {
        alert("Firebase Database connected nahi hai.");
        return;
    }

    const productId =
        id ||
        "lottery_" + Date.now();

    const product = {

        id: productId,

        name,
        price,
        prize,
        description,
        image,
        total,
        status
    };

    await setDoc(
        doc(
            window.firebaseDB,
            "a66aLotteries",
            productId
        ),
        product
    );

    // Local copy bhi update rakhenge
const updatedLotteries =
    id
        ? lotteries.map(item =>
            String(item.id) === String(id)
                ? product
                : item
        )
        : [
            ...lotteries.filter(
                item =>
                    String(item.id) !==
                    String(productId)
            ),
            product
        ];

put(
    K.lotteries,
    updatedLotteries
);

    closeModal();

    renderAll();

    alert("Product Firebase me save ho gaya.");

} catch (error) {

    console.error(
        "Product save error:",
        error
    );

    alert(
        "Product save nahi hua. Console check karo."
    );
}
}


// ======================================================
// TICKETS SECTION
// ======================================================

function renderTickets() {

    const box =
        document.getElementById(
            "ticketProducts"
        );


    if (!box) {
        return;
    }


    const lotteries =
        ls();


    if (!lotteries.length) {

        box.innerHTML = `

            <p class="muted">
                No products available.
            </p>

        `;

        return;
    }


    box.innerHTML =
        lotteries
            .map(lottery => {

                const tickets =
                    pt(lottery.id);


                const total =
                    Number(lottery.total) || 0;


                const sold =
                    tickets.length;


                const unsold =
                    Math.max(
                        0,
                        total - sold
                    );


                return `

                    <div class="admin-card">

                        <h3>
                            ${esc(
                                lottery.name
                            )}
                        </h3>


                        <p class="muted">
                            ${esc(
                                lottery.prize ||
                                ""
                            )}
                        </p>


                        <p>
                            Total:
                            <strong>
                                ${total}
                            </strong>
                        </p>


                        <p>
                            Sold:
                            <strong>
                                ${sold}
                            </strong>
                        </p>


                        <p>
                            Unsold:
                            <strong>
                                ${unsold}
                            </strong>
                        </p>


                        <div class="actions">

                            <button
                                class="smallbtn"
                                type="button"
                                onclick="showTicketPanel('${esc(
                                    lottery.id
                                )}')"
                            >
                                View Tickets
                            </button>

                        </div>

                    </div>

                `;

            })
            .join("");
}


// ======================================================
// SHOW ALL TICKETS
// ======================================================

function showTicketPanel(id) {

    const panel =
        document.getElementById(
            "ticketPanel"
        );


    if (!panel) {
        return;
    }


    const lottery =
        ls().find(
            lottery =>
                String(lottery.id) ===
                String(id)
        );


    if (!lottery) {
        return;
    }


    const soldTickets =
        pt(lottery.id);


    const soldNumbers =
        new Set(
            soldTickets
                .map(
                    ticket =>
                        String(
                            ticket.number ||
                            ticket.ticketNumber ||
                            ""
                        )
                            .trim()
                            .toUpperCase()
                )
                .filter(Boolean)
        );


    const total =
        Number(lottery.total) || 0;


    const soldCount =
        soldNumbers.size;


    const unsoldCount =
        Math.max(
            0,
            total - soldCount
        );


    const numbers =
        nums(total);


    panel.innerHTML = `

        <div>

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                "
            >

                <div>

                    <h2>
                        ${esc(
                            lottery.name
                        )}
                    </h2>

                    <p class="muted">
                        Total: ${total}
                        &nbsp; | &nbsp;
                        Sold: ${soldCount}
                        &nbsp; | &nbsp;
                        Unsold: ${unsoldCount}
                    </p>

                </div>


                <button
                    class="smallbtn"
                    id="closeTicketPanel"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div class="ticket-grid">

                ${
                    numbers
                        .map(number => {

                            const sold =
                                soldNumbers.has(
                                    number.toUpperCase()
                                );


                            return `

                                <div
                                    class="ticket ${
                                        sold
                                            ? "sold"
                                            : "available"
                                    }"
                                >

                                    <strong>
                                        ${esc(
                                            number
                                        )}
                                    </strong>

                                    <br>

                                    <small>
                                        ${
                                            sold
                                                ? "SOLD"
                                                : "UNSOLD"
                                        }
                                    </small>

                                </div>

                            `;

                        })
                        .join("")
                }

            </div>

        </div>

    `;


    panel.classList.remove(
        "hidden"
    );


    const close =
        document.getElementById(
            "closeTicketPanel"
        );


    if (close) {

        close.onclick = () => {

            panel.classList.add(
                "hidden"
            );

        };
    }
}


// ======================================================
// USERS
// ======================================================

async function renderUsers() {

    const table =
        document.getElementById(
            "usersTable"
        );


    const filter =
        document.getElementById(
            "userFilter"
        );


    if (!table) {
        return;
    }


    table.innerHTML = `

        <tr>

            <td colspan="6">
                Loading users...
            </td>

        </tr>

    `;


    const query =
        (
            filter?.value || ""
        )
            .trim()
            .toLowerCase();


    const users =
        await getFirestoreUsers();


    const filtered =
        users.filter(user => {

            if (!query) {
                return true;
            }


            return JSON.stringify(
                user
            )
                .toLowerCase()
                .includes(query);
        });


    if (!filtered.length) {

        table.innerHTML = `

            <tr>

                <td colspan="6">
                    No users found.
                </td>

            </tr>

        `;

        return;
    }


    table.innerHTML =
        filtered
            .map(user => {

                const purchases =
                    userTickets(user);


                const avatar =
                    user.avatar ||
                    "";


                const initial =
                    (
                        user.name ||
                        "U"
                    )
                        .charAt(0)
                        .toUpperCase();


                const userId =
                    user.id ||
                    user.firebaseUid ||
                    user.firebaseDocId ||
                    "";


                return `

                    <tr>

                        <td>

                            ${
                                avatar
                                    ? `

                                        <img
                                            class="avatar"
                                            src="${esc(
                                                avatar
                                            )}"
                                            alt=""
                                        >

                                      `
                                    : `

                                        <div
                                            class="avatar"
                                            style="
                                                display:flex;
                                                align-items:center;
                                                justify-content:center;
                                                background:#20283a;
                                                color:#fff;
                                            "
                                        >
                                            ${esc(
                                                initial
                                            )}
                                        </div>

                                      `
                            }

                        </td>


                        <td>
                            ${esc(
                                user.name ||
                                "Unknown"
                            )}
                        </td>


                        <td>
                            ${esc(
                                user.mobile ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${esc(
                                user.id ||
                                user.firebaseUid ||
                                user.firebaseDocId ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${purchases.length}
                        </td>


                        <td>

                            <button
                                class="smallbtn"
                                type="button"
                                onclick="viewUser('${esc(
                                    userId
                                )}')"
                            >
                                View Profile
                            </button>

                        </td>

                    </tr>

                `;

            })
            .join("");
}


// ======================================================
// VIEW USER PROFILE
// ======================================================

async function viewUser(id) {

    const detail =
        document.getElementById(
            "userDetail"
        );


    if (!detail) {

        alert(
            "User detail section nahi mila."
        );

        return;
    }


    detail.classList.remove(
        "hidden"
    );


    detail.innerHTML = `

        <p class="muted">
            Loading profile...
        </p>

    `;


    try {

        const user =
            await findUser(id);


        if (!user) {

            detail.innerHTML = `

                <p class="muted">
                    User nahi mila.
                </p>

            `;

            return;
        }


        const purchases =
            userTickets(user);


        detail.innerHTML = `

            <div>

                ${
                    user.avatar
                        ? `

                            <img
                                class="avatar"
                                src="${esc(
                                    user.avatar
                                )}"
                                alt=""
                                style="
                                    width:100px;
                                    height:100px;
                                "
                            >

                          `
                        : ""
                }


                <h2>
                    ${esc(
                        user.name ||
                        "Unknown User"
                    )}
                </h2>


                <p>
                    <strong>
                        Email:
                    </strong>

                    ${esc(
                        user.email ||
                        "-"
                    )}
                </p>


                <p>
                    <strong>
                        Mobile:
                    </strong>

                    ${esc(
                        user.mobile ||
                        "-"
                    )}
                </p>


                <p>
                    <strong>
                        Address:
                    </strong>

                    ${esc(
                        user.address ||
                        "-"
                    )}
                </p>


                <p>
                    <strong>
                        User ID:
                    </strong>

                    ${esc(
                        user.id ||
                        "-"
                    )}
                </p>


                <p>
                    <strong>
                        Firebase UID:
                    </strong>

                    ${esc(
                        user.firebaseUid ||
                        user.firebaseDocId ||
                        "-"
                    )}
                </p>


                <hr>


                <h3>
                    Purchased Tickets
                </h3>


                ${
                    purchases.length

                        ? purchases
                            .map(ticket => {

                                const lottery =
                                    ls().find(
                                        lottery =>
                                            String(
                                                lottery.id
                                            ) ===
                                            String(
                                                ticket.lotteryId
                                            )
                                    );


                                return `

                                    <div
                                        class="result"
                                    >

                                        <strong>
                                            ${esc(
                                                ticket.number ||
                                                ticket.ticketNumber ||
                                                "-"
                                            )}
                                        </strong>

                                        <p>
                                            ${esc(
                                                lottery?.name ||
                                                "Unknown Product"
                                            )}
                                        </p>

                                    </div>

                                `;

                            })
                            .join("")

                        : `

                            <p class="muted">
                                No purchases found.
                            </p>

                          `
                }

            </div>

        `;


        detail.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    } catch (error) {

        console.error(
            "View profile error:",
            error
        );


        detail.innerHTML = `

            <p class="muted">
                Profile load nahi ho paya.
            </p>

        `;
    }
}


// ======================================================
// SEARCH
// ======================================================

async function initSearch() {

    const select =
        document.getElementById(
            "searchLottery"
        );


    const button =
        document.getElementById(
            "searchTicketBtn"
        );


    const numberInput =
        document.getElementById(
            "searchNumber"
        );


    const result =
        document.getElementById(
            "numberResult"
        );


    if (
        !select ||
        !button ||
        !numberInput ||
        !result
    ) {
        return;
    }


    const lotteries =
        ls();


    select.innerHTML =
        lotteries
            .map(
                lottery => `

                    <option
                        value="${esc(
                            lottery.id
                        )}"
                    >
                        ${esc(
                            lottery.name
                        )}
                    </option>

                `
            )
            .join("");


    button.onclick =
        async () => {

            const lotteryId =
                select.value;


            const number =
                numberInput.value
                    .trim()
                    .toUpperCase();


            if (
                !/^B\d{10}$/.test(
                    number
                )
            ) {

                result.className =
                    "result";


                result.innerHTML = `

                    <h3>
                        Invalid Number
                    </h3>

                    <p>
                        Enter a valid ticket number.
                        Example:
                        B1000000000
                    </p>

                `;

                return;
            }


            const lottery =
                ls().find(
                    item =>
                        String(item.id) ===
                        String(lotteryId)
                );


            const ticket =
                ts().find(
                    item => {

                        const itemNumber =
                            String(
                                item.number ||
                                item.ticketNumber ||
                                ""
                            )
                                .trim()
                                .toUpperCase();


                        return (
                            itemNumber ===
                            number
                        ) &&
                        String(
                            item.lotteryId
                        ) ===
                        String(
                            lotteryId
                        );
                    }
                );


            // ==========================================
            // UNSOLD
            // ==========================================

            if (!ticket) {

                result.className =
                    "result available";


                result.innerHTML = `

                    <h3>
                        UNSOLD
                    </h3>


                    <p>
                        Ticket
                        <strong>
                            ${esc(
                                number
                            )}
                        </strong>
                        is currently unsold.
                    </p>


                    <p class="muted">
                        Product:
                        ${esc(
                            lottery?.name ||
                            "-"
                        )}
                    </p>

                `;

                return;
            }


            // ==========================================
            // SOLD
            // ==========================================

            const user =
                await findUser(
                    ticket.userId
                );


            result.className =
                "result sold";


            result.innerHTML = `

                <h3>
                    SOLD
                </h3>


                <p>
                    Ticket:
                    <strong>
                        ${esc(
                            number
                        )}
                    </strong>
                </p>


                <p>
                    Product:
                    <strong>
                        ${esc(
                            lottery?.name ||
                            "-"
                        )}
                    </strong>
                </p>


                <p>
                    User:
                    <strong>
                        ${esc(
                            user?.name ||
                            ticket.userName ||
                            "Unknown"
                        )}
                    </strong>
                </p>


                <p>
                    Mobile:
                    ${esc(
                        user?.mobile ||
                        "-"
                    )}
                </p>


                <p>
                    User ID:
                    ${esc(
                        user?.id ||
                        ticket.userId ||
                        "-"
                    )}
                </p>


                ${
                    user
                        ? `

                            <button
                                class="smallbtn"
                                id="openSearchProfile"
                                type="button"
                            >
                                Open Full Profile
                            </button>

                          `
                        : ""
                }

            `;


            const profileButton =
                document.getElementById(
                    "openSearchProfile"
                );


            if (
                profileButton &&
                user
            ) {

                profileButton.onclick =
                    () => {

                        viewUser(
                            user.id ||
                            user.firebaseUid ||
                            user.firebaseDocId
                        );

                    };
            }
        };
}


// ======================================================
// NOTIFICATIONS
// ======================================================

async function setupNotifications() {

    const target =
        document.getElementById(
            "notificationTarget"
        );


    const userBox =
        document.getElementById(
            "notificationUserBox"
        );


    const userSelect =
        document.getElementById(
            "notificationUser"
        );


    const sendButton =
        document.getElementById(
            "sendNotificationBtn"
        );


    const title =
        document.getElementById(
            "notificationTitle"
        );


    const message =
        document.getElementById(
            "notificationMessage"
        );


    const sent =
        document.getElementById(
            "sentNotifications"
        );


    if (
        !target ||
        !userBox ||
        !userSelect ||
        !sendButton ||
        !title ||
        !message ||
        !sent
    ) {
        return;
    }


    async function loadUsers() {

        const users =
            await getFirestoreUsers();


        userSelect.innerHTML = `

            <option value="">
                Select a user
            </option>

        `;


        users.forEach(user => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                user.id ||
                user.firebaseUid ||
                user.firebaseDocId;


            option.textContent =
                `${user.name || "Unknown"} — ${
                    user.mobile ||
                    user.email ||
                    ""
                }`;


            userSelect.appendChild(
                option
            );
        });
    }


    target.onchange =
        async () => {

            if (
                target.value ===
                "user"
            ) {

                userBox.classList.remove(
                    "hidden"
                );


                await loadUsers();

            } else {

                userBox.classList.add(
                    "hidden"
                );


                userSelect.value = "";
            }
        };


    sendButton.onclick =
        async () => {

            const notificationTitle =
                title.value.trim();


            const notificationMessage =
                message.value.trim();


            const targetType =
                target.value;


            const selectedUser =
                userSelect.value;


            if (!notificationTitle) {

                alert(
                    "Notification title required."
                );

                return;
            }


            if (!notificationMessage) {

                alert(
                    "Notification message required."
                );

                return;
            }


            if (
                targetType === "user" &&
                !selectedUser
            ) {

                alert(
                    "Please select a user."
                );

                return;
            }


            const notification = {

                id:
                    "n" +
                    Date.now(),

                title:
                    notificationTitle,

                message:
                    notificationMessage,

                target:
                    targetType === "all"
                        ? "all"
                        : selectedUser,

                createdAt:
                    new Date().toISOString()
            };


            // Save locally

            const notifications =
                get(
                    K.notifications,
                    []
                );


            notifications.push(
                notification
            );


            put(
                K.notifications,
                notifications
            );


            // Save Firestore

            try {

                if (
                    window.firebaseDB
                ) {

                    await setDoc(
                        doc(
                            window.firebaseDB,
                            "a66aNotifications",
                            notification.id
                        ),
                        notification
                    );
                }

            } catch (error) {

                console.error(
                    "Notification Firestore error:",
                    error
                );
            }


            alert(
                "Notification sent successfully."
            );


            title.value = "";

            message.value = "";

            target.value = "all";

            userBox.classList.add(
                "hidden"
            );

            userSelect.value = "";


            renderSentNotifications();
        };


    await loadUsers();

    renderSentNotifications();
}


// ======================================================
// SENT NOTIFICATIONS
// ======================================================

async function renderSentNotifications() {

    const box =
        document.getElementById(
            "sentNotifications"
        );


    if (!box) {
        return;
    }


    const notifications =
        get(
            K.notifications,
            []
        );


    if (!notifications.length) {

        box.innerHTML = `

            <p class="muted">
                No notifications sent yet.
            </p>

        `;

        return;
    }


    const users =
        await getFirestoreUsers();


    box.innerHTML =
        [...notifications]
            .reverse()
            .map(notification => {

                let recipient =
                    "All Users";


                if (
                    notification.target !==
                    "all"
                ) {

                    const user =
                        users.find(
                            user =>
                                String(
                                    user.id
                                ) ===
                                String(
                                    notification.target
                                ) ||

                                String(
                                    user.firebaseUid
                                ) ===
                                String(
                                    notification.target
                                ) ||

                                String(
                                    user.firebaseDocId
                                ) ===
                                String(
                                    notification.target
                                )
                        );


                    recipient =
                        user
                            ? `${user.name || "User"}${
                                user.mobile
                                    ? " — " +
                                      user.mobile
                                    : ""
                              }`
                            : "Particular User";
                }


                return `

                    <div class="result">

                        <h3>
                            ${esc(
                                notification.title
                            )}
                        </h3>


                        <p>
                            ${esc(
                                notification.message
                            )}
                        </p>


                        <small>
                            To:
                            ${esc(
                                recipient
                            )}
                        </small>


                        <br>


                        <small>
                            ${esc(
                                notification.createdAt
                                    ? new Date(
                                        notification.createdAt
                                    )
                                        .toLocaleString()
                                    : ""
                            )}
                        </small>

                    </div>

                `;

            })
            .join("");
}


// ======================================================
// SETTINGS
// ======================================================

function setupSettings() {

    const status =
        document.getElementById(
            "siteStatus"
        );


    const save =
        document.getElementById(
            "saveSettings"
        );


    const clear =
        document.getElementById(
            "clearDemo"
        );


    if (
        !status ||
        !save ||
        !clear
    ) {
        return;
    }


    const settings =
        get(
            K.settings,
            {
                siteStatus: true
            }
        );


    status.checked =
        settings.siteStatus !== false;


    save.onclick =
        () => {

            put(
                K.settings,
                {
                    siteStatus:
                        status.checked
                }
            );


            alert(
                "Settings saved."
            );
        };


    clear.onclick =
        () => {

            const ok =
                confirm(
                    "Clear all sandbox purchases?"
                );


            if (!ok) {
                return;
            }


            put(
                K.tickets,
                []
            );


            renderAll();
        };
}


// ======================================================
// SIDEBAR
// ======================================================

function setupSidebar() {

    const buttons =
        document.querySelectorAll(
            ".side"
        );


    const sections =
        document.querySelectorAll(
            ".section"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                buttons.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                sections.forEach(
                    section =>
                        section.classList.remove(
                            "active"
                        )
                );


                const sectionId =
                    button.dataset.section;


                const section =
                    document.getElementById(
                        sectionId
                    );


                if (section) {

                    section.classList.add(
                        "active"
                    );
                }


                await renderAll();

            }
        );

    });
}


// ======================================================
// MAIN RENDER
// ======================================================

async function renderAll() {

    renderProducts();

    renderTickets();

    // Refresh lottery dropdown
    initSearch();

    await renderDashboard();

    await renderUsers();

    await renderSentNotifications();
}


// ======================================================
// SETUP
// ======================================================

async function setup() {

    setupSidebar();

    setupSettings();

    await setupNotifications();


    // ==================================================
    // ADD PRODUCT BUTTONS
    // ==================================================

    const add1 =
        document.getElementById(
            "addProductBtn"
        );


    const add2 =
        document.getElementById(
            "addProductBtn2"
        );


    if (add1) {

        add1.onclick =
            () => openModal();
    }


    if (add2) {

        add2.onclick =
            () => openModal();
    }


    // ==================================================
    // CLOSE MODAL
    // ==================================================

    const close =
        document.getElementById(
            "closeModal"
        );


    if (close) {

        close.onclick =
            closeModal;
    }


    // ==================================================
    // CLICK OUTSIDE MODAL
    // ==================================================

    const modal =
        document.getElementById(
            "modal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeModal();
                }

            }
        );
    }


    // ==================================================
    // PRODUCT FORM
    // ==================================================

    const form =
        document.getElementById(
            "productForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveProduct
        );
    }


    // ==================================================
    // USER SEARCH
    // ==================================================

    const userFilter =
        document.getElementById(
            "userFilter"
        );


    if (userFilter) {

        let timer;


        userFilter.addEventListener(
            "input",
            () => {

                clearTimeout(timer);


                timer =
                    setTimeout(
                        () => {

                            renderUsers();

                        },
                        250
                    );

            }
        );
    }


    // ==================================================
    // INITIAL RENDER
    // ==================================================

    await renderAll();
}


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.editProduct =
    editProduct;


window.toggleProduct =
    toggleProduct;


window.deleteProduct =
    deleteProduct;


window.showTicketPanel =
    showTicketPanel;


window.viewUser =
    viewUser;

// ======================================================
// ADMIN SECURITY
// ======================================================

async function checkAdminAccess() {

    // Firebase ready hone ka wait
    let auth = window.firebaseAuth;
    let db = window.firebaseDB;

    if (!auth || !db) {

        console.log("Firebase abhi ready nahi hai. Waiting...");

        await new Promise(resolve => {
            setTimeout(resolve, 500);
        });

        auth = window.firebaseAuth;
        db = window.firebaseDB;
    }

    if (!auth || !db) {

        console.error(
            "Firebase Auth ya Firestore initialize nahi hua."
        );

        alert("Firebase initialize nahi hua.");
        return;
    }

    onAuthStateChanged(
        auth,
        async (user) => {

            // Login nahi hai
            if (!user) {

                window.location.href =
                    "login.html";

                return;
            }

            try {

                console.log(
                    "ADMIN LOGIN UID:",
                    user.uid
                );

                const adminRef =
                    doc(
                        db,
                        "a66aUsers",
                        user.uid
                    );

                const adminSnap =
                    await getDoc(adminRef);

                // Admin document nahi mila
                if (!adminSnap.exists()) {

                    console.log(
                        "Admin document nahi mila."
                    );

                    alert(
                        "Access denied."
                    );

                    window.location.href =
                        "index.html";

                    return;
                }

                const adminData =
                    adminSnap.data();

                console.log(
                    "ADMIN DATA:",
                    adminData
                );

                // Admin role check
                if (
                    adminData.role !==
                    "admin"
                ) {

                    alert(
                        "Access denied."
                    );

                    window.location.href =
                        "index.html";

                    return;
                }

                // Sab sahi hai
                console.log(
                    "ADMIN ACCESS GRANTED"
                );

                await setup();

            } catch (error) {

                console.error(
                    "Admin security check error:",
                    error
                );

                alert(
                    "Admin verification failed."
                );

                window.location.href =
                    "index.html";
            }
        }
    );
}


// ======================================================
// START
// ======================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        checkAdminAccess
    );

} else {

    checkAdminAccess();
}

// ======================================================
// START
// ======================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        checkAdminAccess
    );

} else {

    checkAdminAccess();
}