// Sample medicine data (in a real app, this would come from a database)
const medicineImages = {
    "Cetirizine": "https://5.imimg.com/data5/SELLER/Default/2023/5/311448434/ML/FE/LQ/180352824/cetfiz-tab.jpeg",
    "Paracetamol": "https://5.imimg.com/data5/SELLER/Default/2022/8/QM/AX/SS/129887935/paracetamol-tablets-500x500.jpeg",
    "Oseltamivir": "https://globelapharma.com/wp-content/uploads/2023/03/OSELTAMIVIR.png",
    "Ibuprofen": "https://5.imimg.com/data5/SELLER/Default/2023/7/327083834/AE/LV/NU/557330/ibuprofen-tablet.jpg",
    "Sumatriptan": "https://5.imimg.com/data5/AM/FQ/ES/SELLER-67230705/sumatriptan-tablet.jpg",
    "Montelukast": "https://5.imimg.com/data5/SELLER/Default/2023/1/BR/BM/BR/23618296/montelukast-10-mg-tablet.jpg",
    "default": "https://img.freepik.com/free-photo/medicine-capsules-global-health-with-geometric-pattern-digital-remix_53876-104047.jpg"
};
const medicineDatabase = {
    "Common Cold": [
        {
            id: 1,
            name: "Cetirizine",
            company: "Zyrtec",
            price: 120,
            description: "Antihistamine for allergy relief",
            dosage: "10mg tablet"
        },
        {
            id: 2,
            name: "Paracetamol",
            company: "Crocin",
            price: 25,
            description: "Fever reducer and pain reliever",
            dosage: "500mg tablet"
        },
        {
            id: 3,
            name: "Vitamin C",
            company: "Limcee",
            price: 150,
            description: "Immune system support",
            dosage: "500mg chewable tablet"
        }
    ],
    "Flu": [
        {
            id: 4,
            name: "Oseltamivir",
            company: "Tamiflu",
            price: 450,
            description: "Antiviral medication for influenza",
            dosage: "75mg capsule"
        },
        {
            id: 2,
            name: "Paracetamol",
            company: "Crocin",
            price: 25,
            description: "Fever reducer and pain reliever",
            dosage: "500mg tablet"
        },
        {
            id: 5,
            name: "Ibuprofen",
            company: "Brufen",
            price: 40,
            description: "Anti-inflammatory pain reliever",
            dosage: "400mg tablet"
        }
    ],
    "Headache": [
        {
            id: 5,
            name: "Ibuprofen",
            company: "Brufen",
            price: 40,
            description: "Anti-inflammatory pain reliever",
            dosage: "400mg tablet"
        },
        {
            id: 6,
            name: "Sumatriptan",
            company: "Imitrex",
            price: 320,
            description: "For migraine relief",
            dosage: "50mg tablet"
        }
    ],
    "Allergy": [
        {
            id: 1,
            name: "Cetirizine",
            company: "Zyrtec",
            price: 120,
            description: "Antihistamine for allergy relief",
            dosage: "10mg tablet"
        },
        {
            id: 7,
            name: "Montelukast",
            company: "Singulair",
            price: 180,
            description: "For asthma and allergy symptoms",
            dosage: "10mg tablet"
        }
    ]
};

// Cart state
let cart = [];

// DOM elements
const submitDiagnosisBtn = document.getElementById('submitDiagnosis');
const diagnosisResult = document.getElementById('diagnosisResult');
const recommendedMeds = document.getElementById('recommendedMeds');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const resultName = document.getElementById('resultName');
const resultDisease = document.getElementById('resultDisease');

// Event listeners
submitDiagnosisBtn.addEventListener('click', submitDiagnosis);
checkoutBtn.addEventListener('click', proceedToCheckout);

// Submit diagnosis function
function submitDiagnosis() {
    const patientName = document.getElementById('patientName').value;
    const diagnosis = document.getElementById('diagnosis').value;
    
    if (!patientName || !diagnosis) {
        alert('Please enter patient name and diagnosis');
        return;
    }
    
    // Show diagnosis result
    resultName.textContent = patientName;
    resultDisease.textContent = diagnosis;
    diagnosisResult.classList.add('show');
    
    // Show recommended medicines
    showRecommendedMedicines(diagnosis);
}

// Show recommended medicines based on diagnosis
function showRecommendedMedicines(diagnosis) {
    recommendedMeds.innerHTML = '';
    
    // Find medicines for this diagnosis
    const medicines = medicineDatabase[diagnosis] || [];
    
    if (medicines.length === 0) {
        recommendedMeds.innerHTML = '<p>No specific recommendations for this diagnosis. Please consult a pharmacist.</p>';
        return;
    }
    
    // Create medicine cards
    medicines.forEach(medicine => {
        const medicineCard = document.createElement('div');
        medicineCard.className = 'medicine-card';
        
        // Get the appropriate image or use default
        const medicineImage = medicineImages[medicine.name] || medicineImages.default;
        
        medicineCard.innerHTML = `
            <div class="medicine-image">
                <img src="${medicineImage}" alt="${medicine.name}">
            </div>
            <div class="medicine-name">${medicine.name}</div>
            <div class="medicine-company">${medicine.company}</div>
            <div class="medicine-price">₹${medicine.price.toFixed(2)}</div>
            <div class="medicine-description">${medicine.description}</div>
            <div class="medicine-dosage">Dosage: ${medicine.dosage}</div>
            <div class="medicine-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="changeQuantity(${medicine.id}, -1)">-</button>
                    <input type="text" class="quantity-input" id="qty-${medicine.id}" value="1" readonly>
                    <button class="quantity-btn" onclick="changeQuantity(${medicine.id}, 1)">+</button>
                </div>
                <button class="btn btn-secondary" onclick="addToCart(${medicine.id})">
                    <i class="fas fa-cart-plus"></i> Add
                </button>
            </div>
        `;
        recommendedMeds.appendChild(medicineCard);
    });
}

// Change quantity function
function changeQuantity(medicineId, change) {
    const input = document.getElementById(`qty-${medicineId}`);
    let newQty = parseInt(input.value) + change;
    if (newQty < 1) newQty = 1;
    input.value = newQty;
}

// Add to cart function
function addToCart(medicineId) {
    // Find the medicine in our database
    let medicine;
    for (const disease in medicineDatabase) {
        medicine = medicineDatabase[disease].find(m => m.id === medicineId);
        if (medicine) break;
    }
    
    if (!medicine) return;
    
    const qtyInput = document.getElementById(`qty-${medicineId}`);
    const quantity = parseInt(qtyInput.value) || 1;
    
    // Check if already in cart
    const existingItem = cart.find(item => item.id === medicineId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...medicine,
            quantity: quantity
        });
    }
    
    updateCart();
    showToast(`${medicine.name} added to cart`);
}

// Update cart display
function updateCart() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        cartCount.textContent = '0';
        cartTotal.textContent = '₹0.00';
        checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    let itemCount = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <div class="cart-item-name">${item.name} (${item.quantity})</div>
                <div class="cart-item-company">${item.company}</div>
            </div>
            <div class="cart-item-price">₹${itemTotal.toFixed(2)}</div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartCount.textContent = itemCount;
    cartTotal.textContent = `₹${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

// Proceed to checkout
function proceedToCheckout() {
    alert('Checkout functionality would be implemented here!\n\nTotal: ' + cartTotal.textContent);
    // In a real app, this would redirect to a checkout page
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast styles dynamically
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--dark);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1000;
    }
    .toast-notification.show {
        opacity: 1;
    }
`;
document.head.appendChild(toastStyles);