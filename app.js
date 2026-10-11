import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const K = {
    users: "a66aUsers",
    current: "a66aCurrentUser",
    lotteries: "a66aLotteries",
    tickets: "a66aTickets",
    settings: "a66aSettings"
};


// ===============================
// DEFAULT LOTTERY PRODUCTS
// ===============================

const defaults = [
    {
        id: "phone17",
        name: "Premium Phone",
        price: "Sandbox",
        prize: "Premium Smartphone",
        description: "Sample prize product.",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
        total: 100,
        status: "active"
    },
    {
        id: "gaming",
        name: "Gaming Setup",
        price: "Sandbox",
        prize: "Gaming Setup",
        description: "Sample gaming product.",
        image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80",
        total: 100,
        status: "active"
    },
    {
        id: "travel",
        name: "Travel Package",
        price: "Sandbox",
        prize: "Travel Package",
        description: "Sample travel product.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
        total: 100,
        status: "active"
    }
];


// ===============================
// LOCAL STORAGE FUNCTIONS
// ===============================

const get = (key, fallback = []) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};

const set = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

// ===============================
// SECURITY / ID
// ===============================

const esc = value => {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );
};


const uid = () => {
    return (
        "U" +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).slice(2, 6).toUpperCase()
    );
};


// ===============================
// DATA FUNCTIONS
// ===============================

const users = () => get(K.users, []);

const tickets = () => get(K.tickets, []);

function lotteries() {
    let data = get(K.lotteries, []);

    if (!data.length) {
        set(K.lotteries, defaults);
        data = defaults;
    }

    return data;
}

const current = () => get(K.current, null);


async function syncLotteriesFromFirebase() {

    try {

        const {
            collection,
            getDocs
        } = await import(
            "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
        );

        // Firebase DB ka wait
        let db = window.firebaseDB;

        if (!db) {

            console.log("Firebase DB abhi ready nahi hai.");

            await new Promise(resolve => {
                setTimeout(resolve, 500);
            });

            db = window.firebaseDB;
        }

        if (!db) {
            console.error("Firebase DB initialize nahi hua.");
            return;
        }

        const snapshot = await getDocs(
            collection(
                db,
                "a66aLotteries"
            )
        );

        const firebaseProducts =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        console.log(
            "FIREBASE PRODUCTS:",
            firebaseProducts
        );

        if (firebaseProducts.length > 0) {

            set(
                K.lotteries,
                firebaseProducts
            );

            console.log(
                "Firebase products loaded:",
                firebaseProducts
            );

            renderHome();

        } else {

            console.log(
                "Firebase me koi product nahi mila."
            );
        }

    } catch (error) {

        console.error(
            "Firebase products load error:",
            error
        );

    }
}

async function syncTicketsFromFirebase() {
    try {
        const {
            collection,
            getDocs
        } = await import(
            "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
        );

        const db = window.firebaseDB;

        if (!db) {
            throw new Error("Firebase DB initialize nahi hua.");
        }

        const snapshot = await getDocs(
            collection(db, "a66aTickets")
        );

        const firebaseTickets = snapshot.docs.map(d => ({
            ...d.data(),
            id: d.id
        }));

        set(K.tickets, firebaseTickets);

        console.log(
            "Firebase tickets loaded:",
            firebaseTickets.length
        );

    } catch (error) {
        console.error(
            "Firebase tickets load error:",
            error
        );
        throw error;
    }
}
// ===============================
// DEMO OTP + NOTIFICATION
// ===============================

let demoOTP = null;

function generateDemoOTP() {
    return String(
        Math.floor(100000 + Math.random() * 900000)
    );
}

async function showOTPNotification(otp) {

    // Browser notification supported hai?
    if ("Notification" in window) {

        try {

            // Permission nahi hai to permission mango
            if (Notification.permission === "default") {
                await Notification.requestPermission();
            }

            // Permission mil gayi
            if (Notification.permission === "granted") {

                new Notification("My Website", {
                    body: "Your OTP is " + otp,
                    tag: "demo-otp",
                    renotify: true
                });

                return;
            }

        } catch (error) {
            console.error(
                "Notification error:",
                error
            );
        }
    }

    // Notification available na ho to fallback
    alert("Demo OTP: " + otp);
}

    async function sendFirebaseOTP(mobile, buttonId, type) {

        const phone = String(mobile || "").replace(/\D/g, "");

        if (!/^[6-9]\d{9}$/.test(phone)) {
            throw new Error(
            "Valid 10 digit Indian mobile number enter karo."
        );
    }

    // Demo OTP generate
    demoOTP = generateDemoOTP();

    console.log(
        "DEMO OTP:",
        demoOTP
    );

    // Notification
    await showOTPNotification(demoOTP);

    return true;
}


async function verifyFirebaseOTP(inputOTP) {

    if (!demoOTP) {
        throw new Error(
            "Pehle Send OTP dabao."
        );
    }

    const code =
        String(inputOTP || "").trim();

    if (!/^\d{6}$/.test(code)) {
        throw new Error(
            "6 digit OTP enter karo."
        );
    }

    if (code !== demoOTP) {

        throw new Error(
            "OTP galat hai."
        );
    }

    // OTP successfully verified
    demoOTP = null;

    // Fake verification object
    return {
        uid: "DEMO-" + Date.now()
    };
}


function clearOTP() {
    demoOTP = null;
}


// ===============================
// TICKET NUMBERS
// ===============================

const ticketNumbers = n => {
    return Array.from(
        { length: n },
        (_, i) => "B" + String(100000 + i).padStart(6, "0")
    );
};


// ===============================
// HOME PAGE
// ===============================

function renderHome() {

    const grid = document.getElementById("productGrid");

    if (!grid) {
        return;
    }

    const settings = get(K.settings, {
        siteStatus: true
    });

    const notice = document.getElementById("siteNotice");

    if (notice) {
        notice.textContent = settings.siteStatus
            ? "Active"
            : "Paused";
    }


    grid.innerHTML = lotteries()
        .filter(item => item.status !== "deleted")
        .map(lottery => {

            const sold = tickets()
                .filter(ticket => ticket.lotteryId === lottery.id)
                .length;

            return `
                <article class="product-card">

                    <img
                        src="${esc(lottery.image)}"
                        onerror="this.style.display='none'"
                    >

                    <p class="eyebrow">
                        ${esc(lottery.status)}
                    </p>

                    <h3>
                        ${esc(lottery.name)}
                    </h3>

                    <p class="muted">
                        ${esc(lottery.description)}
                    </p>

                    <div class="price">
                        ${esc(lottery.price)}
                    </div>

                    <p class="small">
                        Prize: ${esc(lottery.prize)}
                        ·
                        ${sold}/${lottery.total} selected
                    </p>

                    <a
                        class="btn primary"
                        href="checkout.html?lottery=${encodeURIComponent(lottery.id)}"
                    >
                        Select Ticket
                    </a>

                </article>
            `;

        })
        .join("");


    if (!grid.innerHTML) {

        grid.innerHTML = `
            <div class="empty">
                No products available.
            </div>
        `;
    }
}


// ===============================
// REGISTER - EMAIL/PASSWORD
// ===============================

function setupRegister() {

    const form = document.getElementById("registerForm");

    if (!form) {
        return;
    }

    form.onsubmit = async event => {

        event.preventDefault();

        const name =
            document.getElementById("regName").value.trim();

        const email =
            document.getElementById("regEmail").value.trim();

        const mobile =
            document
                .getElementById("regMobile")
                .value
                .replace(/\D/g, "");

        const password =
            document.getElementById("regPassword").value;

        const password2 =
            document.getElementById("regPassword2").value;

        const address =
            document.getElementById("regAddress").value.trim();


        // Basic validation
        if (!name) {
            alert("Name enter karo.");
            return;
        }

        if (!email) {
            alert("Email enter karo.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Valid email enter karo.");
            return;
        }

        if (mobile.length !== 10) {
            alert("Valid 10 digit mobile number enter karo.");
            return;
        }

        if (password.length < 6) {
            alert("Password minimum 6 characters ka hona chahiye.");
            return;
        }

        if (password !== password2) {
            alert("Passwords do not match.");
            return;
        }


        // Firebase Auth check
        if (!window.firebaseAuth) {
            alert("Page refresh karo.");
            return;
        }


        try {

            const { createUserWithEmailAndPassword } =
                await import(
                    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"
                );


            // Create Firebase account
            const userCredential =
                await createUserWithEmailAndPassword(
                    window.firebaseAuth,
                    email,
                    password
                );


            const firebaseUser =
                userCredential.user;


            // Create website profile
            const finishRegistration = async avatar => {

                const user = {

                    id: uid(),

                    firebaseUid: firebaseUser.uid,

                    name: name,

                    email: email,

                    mobile: mobile,

                    address: address,

                    avatar: avatar || "",

                    verified: true,

                    createdAt: new Date().toISOString()

                };
                


                // Save user to Firestore first
if (!window.firebaseDB) {
    throw new Error("Firestore database initialize nahi hua.");
}

await setDoc(
    doc(
        window.firebaseDB,
        "a66aUsers",
        firebaseUser.uid
    ),
    user
);

console.log("User Firestore me save ho gaya:", user);

// Save user locally
const allUsers = users();

allUsers.push(user);

set(K.users, allUsers);
set(K.current, user);

// Go to profile
location.href = "profile.html";
            };


            // Avatar
            const file =
                document.getElementById("regAvatar").files[0];


            if (file) {

                const reader = new FileReader();

                reader.onload = () => {
                    finishRegistration(reader.result);
                };

                reader.readAsDataURL(file);

            } else {

                finishRegistration("");

            }

        } catch (error) {

            console.error("registration error:", error);


            if (error.code === "auth/email-already-in-use") {

                alert("Ye email already registered hai.");

            } else if (error.code === "auth/invalid-email") {

                alert("Email address invalid hai.");

            } else if (error.code === "auth/weak-password") {

                alert("Password bahut weak hai. Minimum 6 characters rakho.");

            } else {

                alert(
                    "Registration failed: " +
                    (error.message || "Unknown error")
                );

            }

        }

    };
}


// ===============================
// LOGIN
// ===============================

function setupLogin() {

    const form = document.getElementById("loginForm");

    if (!form) {
        return;
    }


    // =================================
    // MOBILE + PASSWORD LOGIN
    // =================================

    form.onsubmit = async event => {

        event.preventDefault();

        const mobile =
            document
                .getElementById("loginMobile")
                .value
                .replace(/\D/g, "");

        const password =
            document
                .getElementById("loginPassword")
                .value;


        // Mobile check
        if (!/^[6-9]\d{9}$/.test(mobile)) {

            alert(
                "Valid 10 digit mobile number enter karo."
            );

            return;
        }


        // Password check
        if (!password) {

            alert(
                "Password enter karo."
            );

            return;
        }


        // =================================
        // MOBILE SE USER FIND
        // =================================

        const user =
            users().find(
                item =>
                    item.mobile === mobile
            );


        if (!user) {

            alert(
                "Pehle register karo."
            );

            return;
        }


        // =================================
        // FIREBASE PASSWORD LOGIN
        // =================================

        if (!window.firebaseAuth) {

            alert(
                " Page refresh karo."
            );

            return;
        }


        try {

            const {
                signInWithEmailAndPassword
            } = await import(
                "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"
            );


            await signInWithEmailAndPassword(
                window.firebaseAuth,
                user.email,
                password
            );


            // =================================
            // LOGIN SUCCESS
            // =================================

            set(K.current, user);

            location.href = "profile.html";


        } catch (error) {

            console.error(
                "Password login error:",
                error
            );


            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                alert(
                    "Mobile number ya password galat hai."
                );

            } else if (
                error.code ===
                "auth/wrong-password"
            ) {

                alert(
                    "Password galat hai."
                );

            } else {

                alert(
                    "Login failed: " +
                    (
                        error.message ||
                        "Unknown error"
                    )
                );

            }

        }

    };



// =================================
// B2 ADMIN LOGIN
// =================================

const adminLoginBtn =
    document.getElementById("adminLoginBtn");

if (adminLoginBtn) {

    adminLoginBtn.onclick = async () => {

        alert("B2 code chal raha hai");

        const email =
            prompt("Admin Gmail enter karo:");

        const password =
            prompt("Admin password enter karo:");

        if (!email || !password) {
            alert("Gmail aur password dono enter karo.");
            return;
        }

        try {

           const {
    initializeApp,
    getApps
} = await import(
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"
);

const {
    getAuth,
    signInWithEmailAndPassword
} = await import(
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js"
);

const firebaseConfig = {
    apiKey: "AIzaSyB61InR_o5Yx6oqVQHny8C8zCmn2TANTjc",
    authDomain: "belucky-d9520.firebaseapp.com",
    projectId: "belucky-d9520",
    storageBucket: "belucky-d9520.firebasestorage.app",
    messagingSenderId: "1079754426594",
    appId: "1:1079754426594:web:fc7ebdc562b559f8e2b6bb"
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

const auth = getAuth(app);

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            location.href = "admin.html";

        } 
        catch (error) {

            console.error("ADMIN LOGIN ERROR:", error);

            alert(
               "Firebase Error:\n\n" +
                error.code +
              "\n\n" +
               error.message
            );
        }

    };

}


    // =================================
    // DEMO OTP LOGIN
    // =================================

    const otpButton =
        document.getElementById(
            "otpLoginBtn"
        );


    if (otpButton) {

        otpButton.onclick = async () => {

            const mobile =
                document
                    .getElementById("loginMobile")
                    .value
                    .replace(/\D/g, "");


            // Mobile validation
            if (!/^[6-9]\d{9}$/.test(mobile)) {

                alert(
                    "Valid 10 digit mobile number enter karo."
                );

                return;
            }


            // =================================
            // CHECK MOBILE ACCOUNT
            // =================================

            const user =
                users().find(
                    item =>
                        item.mobile === mobile
                );


            if (!user) {

                alert(
                    "Is mobile number se account nahi mila. Pehle register karo."
                );

                return;
            }


            try {

                otpButton.disabled =
                    true;

                otpButton.textContent =
                    "Sending OTP...";


                // =================================
                // DEMO OTP
                // =================================

                await sendFirebaseOTP(
                    mobile,
                    "otpLoginBtn",
                    "login"
                );


                // =================================
                // COPY MOBILE TO OTP SECTION
                // =================================

                const otpMobile =
                    document.getElementById(
                        "otpMobile"
                    );


                if (otpMobile) {

                    otpMobile.value =
                        mobile;

                }


                // =================================
                // HIDE LOGIN
                // =================================

                const loginSection =
                    document.getElementById(
                        "loginSection"
                    );


                if (loginSection) {

                    loginSection.style.display =
                        "none";

                }


                // =================================
                // SHOW OTP
                // =================================

                const otpSection =
                    document.getElementById(
                        "otpSection"
                    );


                if (otpSection) {

                    otpSection.style.display =
                        "block";

                }


            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "OTP send nahi hua."
                );

            } finally {

                otpButton.disabled =
                    false;

                otpButton.textContent =
                    "Login with OTP";

            }

        };

    }


    // =================================
    // VERIFY DEMO OTP
    // =================================

    const otpSubmitBtn =
        document.getElementById(
            "otpSubmitBtn"
        );


    if (otpSubmitBtn) {

        otpSubmitBtn.onclick = async () => {

            const mobile =
                document
                    .getElementById("otpMobile")
                    .value
                    .replace(/\D/g, "");


            const enteredOTP =
                document
                    .getElementById("otpInput")
                    .value
                    .trim();


            // Mobile check
            if (!/^[6-9]\d{9}$/.test(mobile)) {

                alert(
                    "Valid 10 digit mobile number enter karo."
                );

                return;
            }


            // OTP format check
            if (!/^\d{6}$/.test(enteredOTP)) {

                alert(
                    "6 digit capture code enter karo."
                );

                return;
            }


            // =================================
            // CHECK DEMO OTP
            // =================================

            try {

                await verifyFirebaseOTP(
                    enteredOTP
                );


            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "capture code galat hai."
                );

                return;
            }


            // =================================
            // OTP CORRECT, MOBILE SE USER FIND
            // =================================

            const user =
                users().find(
                    item =>
                        item.mobile === mobile
                );


            if (!user) {

                alert(
                    "Is mobile number se account nahi mila."
                );

                clearOTP();

                return;
            }


            // =================================
            // LOGIN SUCCESS
            // =================================

            set(K.current, user);

            clearOTP();

            location.href = "profile.html";

        };

    }


    // =================================
    // RESEND DEMO OTP
    // =================================

    const resendOtpBtn =
        document.getElementById(
            "resendOtpBtn"
        );


    if (resendOtpBtn) {

        resendOtpBtn.onclick = async () => {

            const otpMobile =
                document.getElementById(
                    "otpMobile"
                );


            if (!otpMobile) {
                return;
            }


            const mobile =
                otpMobile.value
                    .replace(/\D/g, "");


            if (!/^[6-9]\d{9}$/.test(mobile)) {

                alert(
                    "Valid 10 digit mobile number enter karo."
                );

                return;
            }


            try {

                resendOtpBtn.disabled =
                    true;

                resendOtpBtn.textContent =
                    "Sending...";


                // DEMO OTP ONLY
                await sendFirebaseOTP(
                    mobile,
                    "otpLoginBtn",
                    "login"
                );


            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "capture code resend nahi hua."
                );

            } finally {

                resendOtpBtn.disabled =
                    false;

                resendOtpBtn.textContent =
                    "Resend capture code";

            }

        };

    }

}

// ===============================
// PROFILE
// ===============================

function setupProfile() {

    const box =
        document.getElementById("profileBox");


    if (!box) {
        return;
    }


    const user = current();


    if (!user) {

        location.href = "login.html";

        return;
    }


box.innerHTML = `

    <div class="profile-card">

        <div class="profile-avatar">
            <img
                src="${esc(
                    user.avatar ||
                    "https://i.pravatar.cc/200?img=12"
                )}"
                alt="${esc(user.name)}"
                onerror="this.src='https://i.pravatar.cc/200?img=12'"
            >
        </div>


        <div class="profile-info">

            <p class="eyebrow">
                MY PROFILE
            </p>

            <h1>
                ${esc(user.name)}
            </h1>


            <div class="profile-details">

                <div class="profile-detail">
                    <span class="detail-label">
                        Gmail
                    </span>

                    <span class="detail-value">
                        ${esc(user.email)}
                    </span>
                </div>


                <div class="profile-detail">
                    <span class="detail-label">
                        Mobile Number
                    </span>

                    <span class="detail-value">
                        ${esc(user.mobile)}
                    </span>
                </div>


                <div class="profile-detail">
                    <span class="detail-label">
                        Address
                    </span>

                    <span class="detail-value">
                        ${esc(user.address || "Not provided")}
                    </span>
                </div>


                <div class="profile-detail">
                    <span class="detail-label">
                        User ID
                    </span>

                    <span class="detail-value">
                        ${esc(user.id)}
                    </span>
                </div>

            </div>

        </div>

    </div>

`;



    // MY TICKETS
    const list =
        document.getElementById("myTickets");


    if (list) {

        const ownTickets =
            tickets().filter(
                ticket =>
                    ticket.userId === user.id
            );


        if (ownTickets.length) {

            list.innerHTML =
                ownTickets
                    .map(ticket => {

                        return `

                            <div class="ticket-item">

                                <div>

                                    <div class="ticket-code">
                                        ${esc(ticket.number)}
                                    </div>

                                    <div>
                                        ${esc(ticket.lotteryName)}
                                    </div>

                                </div>

                                <div class="small">
                                    ${esc(ticket.date)}
                                </div>

                            </div>

                        `;

                    })
                    .join("");

        } else {

            list.innerHTML = `
                <div class="empty">
                    Abhi koi purchased ticket nahi hai.
                </div>
            `;
        }
    }


    // LOGOUT
    const logoutButton =
        document.getElementById("logoutBtn");


    if (logoutButton) {

        logoutButton.onclick = () => {

            localStorage.removeItem(K.current);

            location.href = "index.html";
        };
    }
}


// ===============================
// CHECKOUT
// ===============================

function setupCheckout() {

    const summary =
        document.getElementById("checkoutSummary");


    if (!summary) {
        return;
    }


    const lotteryId = new URLSearchParams(location.search).get("lottery");

    const lottery = lotteries().find(item => item.id === lotteryId);

        const ticketPrice = Number(lottery?.price);

        if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
    summary.innerHTML = `
        <p class="empty">
            Invalid ticket price. Admin panel mein sahi price set karo.
        </p>
    `;
    return;
}

    const user = current();

    // Product not found
    if (!lottery) {

        summary.innerHTML = `
            <div class="empty">
                Product not found.
            </div>
        `;

        return;
    }


    // User login check
    if (!user) {

        location.href = "login.html";

        return;
    }


    // Used ticket numbers
    const used =
        new Set(
            tickets()
                .filter(
                    ticket =>
                        ticket.lotteryId === lotteryId
                )
                .map(
                    ticket =>
                        ticket.number
                )
        );


    // Available tickets
    const available =
        ticketNumbers(lottery.total)
            .filter(
                number =>
                    !used.has(number)
            );


    summary.innerHTML = `

        <p><b>Prize:</b>  ${esc(lottery.prize)}</p>

        <p><b>Ticket Price:</b> ₹${ticketPrice.toFixed(2)}</p>

        <p> ${esc(lottery.description)}</p>

        <label>
            Select ticket number

            <select id="ticketSelect">

                ${available
                    .slice(0, 50)
                    .map(
                        number =>
                            `<option>${number}</option>`
                    )
                    .join("")}

            </select>

        </label>

        <p class="small">
            ${available.length}
            ticket numbers available.
        </p>
    `;


    
    // RAZORPAY TEST PAYMENT
    const PAYMENT_API = "https://belucky-d9520.onrender.com";

    const paymentButton = document.getElementById("sandboxPay");

    if (paymentButton) {
        paymentButton.onclick = async () => {
            const select = document.getElementById("ticketSelect");

            if (!select) {
                alert("Ticket select nahi hua.");
                return;
            }

            const number = select.value;

            if (!number) {
                alert("Pehle ticket number select karo.");
                return;
            }

            if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
                alert("Admin panel mein valid ticket price set karo.");
                return;
            }

            paymentButton.disabled = true;

            try {
                // Create Razorpay order (amount is in paise)
                const orderResponse = await fetch(
                    `${PAYMENT_API}/create-order`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            amount: Math.round(ticketPrice * 100)
                        })
                    }
                );

                const orderData = await orderResponse.json();

                if (!orderResponse.ok) {
                    throw new Error(
                        orderData.error || "Order create nahi hua."
                    );
                }

                if (!window.Razorpay) {
                    throw new Error("Razorpay Checkout script load nahi hui.");
                }

                const options = {
                    key: orderData.keyId,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "beLucky",
                    description: `Ticket ${number} - ${lottery.name}`,
                    order_id: orderData.orderId,

                    handler: async function (response) {
                        try {
                            const verifyResponse = await fetch(
                                `${PAYMENT_API}/verify-payment`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        razorpay_order_id:
                                            response.razorpay_order_id,
                                        razorpay_payment_id:
                                            response.razorpay_payment_id,
                                        razorpay_signature:
                                            response.razorpay_signature
                                    })
                                }
                            );

                            const verifyData = await verifyResponse.json();

                            if (!verifyResponse.ok || !verifyData.verified) {
                                alert(
                                    "Payment verify nahi hua. Ticket issue nahi kiya gaya."
                                );
                                return;
                            }

                            alert(
                                "Test payment verify ho gaya. Ticket abhi issue nahi hua; ticket reservation ka secure setup baaki hai."
                            );
                        } catch (error) {
                            console.error("Verification error:", error);
                            alert(
                                "Payment verification ka result nahi mil saka. Dobara payment karne se pehle status check karo."
                            );
                        } finally {
                            paymentButton.disabled = false;
                        }
                    },

                    modal: {
                        ondismiss: function () {
                            paymentButton.disabled = false;
                        }
                    },

                    theme: {
                        color: "#3399cc"
                    }
                };

                const checkout = new window.Razorpay(options);

                checkout.on("payment.failed", function (response) {
                    console.error("Razorpay payment failed:", response.error);
                    alert("Test payment fail hua. Dobara try kar sakte ho.");
                    paymentButton.disabled = false;
                });

                checkout.open();

            } catch (error) {
                console.error("Payment error:", error);
                alert(error.message || "Payment start nahi ho paya.");
                paymentButton.disabled = false;
            }
        };
    }
}


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

    await syncLotteriesFromFirebase();

    try {
        await syncTicketsFromFirebase();
    } catch (error) {
        console.error("Shared tickets load nahi hue:", error);
    }

    renderHome();
    setupRegister();
    setupLogin();
    setupProfile();
    setupCheckout();

});