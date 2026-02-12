// Global state
let filteredBooks = [...booksData];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentBook = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderBooks();
    updateCartCount();
    updateWishlistCount();
    initializeEventListeners();
    populateSearchFilters();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Category and Sort Filters
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
    document.getElementById('pagesFilter').addEventListener('change', applyFilters);

    // Price Range Sliders
    document.getElementById('minPrice').addEventListener('input', updatePriceRange);
    document.getElementById('maxPrice').addEventListener('input', updatePriceRange);

    // Clear Filters
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Search
    document.getElementById('searchBtn').addEventListener('click', () => {
        document.getElementById('searchOverlay').classList.add('active');
        document.getElementById('searchInput').focus();
    });

    document.getElementById('closeSearch').addEventListener('click', () => {
        document.getElementById('searchOverlay').classList.remove('active');
    });

    document.getElementById('searchInput').addEventListener('input', performSearch);

    // Cart
    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('active');
        renderCart();
    });

    document.getElementById('closeCart').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.remove('active');
    });

    document.getElementById('continueShopping').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.remove('active');
    });

    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);

    // Wishlist
    document.getElementById('wishlistBtn').addEventListener('click', () => {
        document.getElementById('wishlistSidebar').classList.add('active');
        renderWishlist();
    });

    document.getElementById('closeWishlist').addEventListener('click', () => {
        document.getElementById('wishlistSidebar').classList.remove('active');
    });

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    document.getElementById('modalAddToCart').addEventListener('click', () => {
        if (currentBook) {
            addToCart(currentBook);
        }
    });
    document.getElementById('modalAddToWishlist').addEventListener('click', () => {
        if (currentBook) {
            addToWishlist(currentBook);
        }
    });

    // Auth
    document.getElementById('loginBtn').addEventListener('click', () => {
        document.getElementById('authModal').classList.add('active');
    });

    document.getElementById('authModalClose').addEventListener('click', () => {
        document.getElementById('authModal').classList.remove('active');
    });

    document.getElementById('authModalOverlay').addEventListener('click', () => {
        document.getElementById('authModal').classList.remove('active');
    });

    // Auth Tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.dataset.tab;
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(tabName + 'Form').classList.add('active');
        });
    });

    // Auth Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Tracking
    document.getElementById('trackBtn').addEventListener('click', handleTracking);
}

// Render books
function renderBooks() {
    const grid = document.getElementById('booksGrid');

    if (filteredBooks.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <h3>No books found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredBooks.map(book => `
        <div class="book-card" onclick="openBookModal(${book.id})">
            <div class="book-image-container">
                <img src="${book.image}" alt="${book.title}" class="book-image">
                <span class="book-badge">New</span>
                <div class="wishlist-icon" onclick="event.stopPropagation(); toggleWishlist(${book.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isInWishlist(book.id) ? '#C17767' : 'none'}" stroke="${isInWishlist(book.id) ? '#C17767' : 'currentColor'}" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </div>
            </div>
            <div class="book-info">
                <div class="book-category">${book.category}</div>
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <div class="book-rating">
                    <span class="stars">${generateStars(book.rating)}</span>
                    <span class="rating-value">${book.rating}</span>
                </div>
                <div class="book-footer">
                    <span class="book-price">$${book.price.toFixed(2)}</span>
                    <span class="book-pages">${book.pages} pages</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Generate stars
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    if (hasHalfStar) {
        stars += '☆';
    }
    while (stars.length < 5) {
        stars += '☆';
    }

    return stars;
}

// Apply filters
function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const sort = document.getElementById('sortFilter').value;
    const rating = parseFloat(document.getElementById('ratingFilter').value);
    const pages = document.getElementById('pagesFilter').value;
    const minPrice = parseFloat(document.getElementById('minPrice').value);
    const maxPrice = parseFloat(document.getElementById('maxPrice').value);

    // Filter by category
    filteredBooks = category === 'all' ?
        [...booksData] :
        booksData.filter(book => book.category === category);

    // Filter by rating
    if (rating > 0) {
        filteredBooks = filteredBooks.filter(book => book.rating >= rating);
    }

    // Filter by pages
    if (pages !== 'all') {
        const [min, max] = pages === '601+' ?
            [601, Infinity] :
            pages.split('-').map(Number);
        filteredBooks = filteredBooks.filter(book => book.pages >= min && book.pages <= (max || Infinity));
    }

    // Filter by price
    filteredBooks = filteredBooks.filter(book => book.price >= minPrice && book.price <= maxPrice);

    // Sort
    switch (sort) {
        case 'price-low':
            filteredBooks.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredBooks.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredBooks.sort((a, b) => b.rating - a.rating);
            break;
        case 'trendy':
            filteredBooks.sort((a, b) => b.id - a.id);
            break;
        default: // recommended
            filteredBooks.sort((a, b) => b.rating - a.rating);
    }

    renderBooks();
}

// Update price range
function updatePriceRange() {
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;

    document.getElementById('minPriceValue').textContent = minPrice;
    document.getElementById('maxPriceValue').textContent = maxPrice;

    applyFilters();
}

// Clear filters
function clearFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('sortFilter').value = 'recommended';
    document.getElementById('ratingFilter').value = '0';
    document.getElementById('pagesFilter').value = 'all';
    document.getElementById('minPrice').value = '0';
    document.getElementById('maxPrice').value = '100';
    document.getElementById('minPriceValue').textContent = '0';
    document.getElementById('maxPriceValue').textContent = '100';

    applyFilters();
}

// Search functionality
function populateSearchFilters() {
    const authors = [...new Set(booksData.map(book => book.author))].sort();
    const authorSelect = document.getElementById('searchAuthor');

    authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorSelect.appendChild(option);
    });
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const author = document.getElementById('searchAuthor').value;
    const publisher = document.getElementById('searchPublisher').value;
    const year = document.getElementById('searchYear').value;
    const language = document.getElementById('searchLanguage').value;

    let results = booksData.filter(book => {
        const matchesQuery = book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.category.toLowerCase().includes(query);
        const matchesAuthor = !author || book.author === author;
        const matchesLanguage = !language || language === 'English';

        return matchesQuery && matchesAuthor && matchesLanguage;
    });

    const searchResults = document.getElementById('searchResults');

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
        return;
    }

    searchResults.innerHTML = results.slice(0, 10).map(book => `
        <div class="search-result-item" onclick="openBookModal(${book.id}); document.getElementById('searchOverlay').classList.remove('active');">
            <h4>${book.title}</h4>
            <p>${book.author} • ${book.category} • $${book.price.toFixed(2)}</p>
        </div>
    `).join('');
}

// Modal functions
function openBookModal(bookId) {
    const book = booksData.find(b => b.id === bookId);
    if (!book) return;

    currentBook = book;

    document.getElementById('modalBookImage').src = book.image;
    document.getElementById('modalBookImage').alt = book.title;
    document.getElementById('modalBookTitle').textContent = book.title;
    document.getElementById('modalBookAuthor').textContent = `by ${book.author}`;
    document.getElementById('modalBookRating').innerHTML = `
        <span class="stars">${generateStars(book.rating)}</span>
        <span class="rating-value">${book.rating}</span>
    `;
    document.getElementById('modalBookPrice').textContent = `$${book.price.toFixed(2)}`;
    document.getElementById('modalBookPages').textContent = `${book.pages} pages`;
    document.getElementById('modalBookCategory').textContent = book.category;
    document.getElementById('modalBookSummary').textContent = book.summary;

    document.getElementById('bookModal').classList.add('active');
}

function closeModal() {
    document.getElementById('bookModal').classList.remove('active');
    currentBook = null;
}

// Cart functions
function addToCart(book) {
    const existingItem = cart.find(item => item.id === book.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...book, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Added to cart!');
    renderCart();
}

function removeFromCart(bookId) {
    cart = cart.filter(item => item.id !== bookId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

function updateQuantity(bookId, change) {
    const item = cart.find(item => item.id === bookId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(bookId);
        return;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    document.getElementById('cartCount').style.display = count > 0 ? 'block' : 'none';
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h3>Your cart is empty</h3>
                <p>Add some books to get started</p>
            </div>
        `;
        document.getElementById('cartTotal').textContent = '$0.00';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.title}</h4>
                <p class="cart-item-author">${item.author}</p>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

// Wishlist functions
function toggleWishlist(bookId) {
    const book = booksData.find(b => b.id === bookId);
    if (!book) return;

    if (isInWishlist(bookId)) {
        removeFromWishlist(bookId);
    } else {
        addToWishlist(book);
    }
}

function addToWishlist(book) {
    if (!isInWishlist(book.id)) {
        wishlist.push(book);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        updateWishlistCount();
        showNotification('Added to wishlist!');
        renderBooks();
        renderWishlist();
    }
}

function removeFromWishlist(bookId) {
    wishlist = wishlist.filter(item => item.id !== bookId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    renderBooks();
    renderWishlist();
}

function isInWishlist(bookId) {
    return wishlist.some(item => item.id === bookId);
}

function updateWishlistCount() {
    const count = wishlist.length;
    document.getElementById('wishlistCount').textContent = count;
    document.getElementById('wishlistCount').style.display = count > 0 ? 'block' : 'none';
}

function renderWishlist() {
    const wishlistItems = document.getElementById('wishlistItems');

    if (wishlist.length === 0) {
        wishlistItems.innerHTML = `
            <div class="empty-state">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <h3>Your wishlist is empty</h3>
                <p>Save books you love</p>
            </div>
        `;
        return;
    }

    wishlistItems.innerHTML = wishlist.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.title}</h4>
                <p class="cart-item-author">${item.author}</p>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-actions">
                    <button class="remove-btn" onclick="removeFromWishlist(${item.id})">Remove</button>
                    <button class="quantity-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Auth functions
function handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('[type="email"]').value;
    const password = e.target.querySelector('[type="password"]').value;

    // Simple mock authentication
    currentUser = { email, name: email.split('@')[0] };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showNotification('Logged in successfully!');
    document.getElementById('authModal').classList.remove('active');
}

function handleRegister(e) {
    e.preventDefault();
    const name = e.target.querySelector('[placeholder="John Doe"]').value;
    const email = e.target.querySelectorAll('[type="email"]')[0].value;
    const password = e.target.querySelectorAll('[type="password"]')[0].value;

    // Simple mock registration
    currentUser = { email, name };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    showNotification('Registered successfully!');
    document.getElementById('authModal').classList.remove('active');
}

// Checkout
function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    if (!currentUser) {
        document.getElementById('cartSidebar').classList.remove('active');
        document.getElementById('authModal').classList.add('active');
        showNotification('Please login to checkout');
        return;
    }

    const orderNumber = 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase();
    showNotification(`Order placed successfully! Order #${orderNumber}`);

    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();

    setTimeout(() => {
        document.getElementById('cartSidebar').classList.remove('active');
    }, 1500);
}

// Tracking
function handleTracking() {
    const orderNumber = document.getElementById('trackingInput').value;
    const trackingResult = document.getElementById('trackingResult');

    if (!orderNumber) {
        showNotification('Please enter an order number');
        return;
    }

    // Mock tracking result
    trackingResult.innerHTML = `
        <h3>Order #${orderNumber}</h3>
        <div style="padding: 1.5rem 0;">
            <div style="margin-bottom: 1rem;">
                <strong>Status:</strong> In Transit
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Estimated Delivery:</strong> ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
            <div>
                <strong>Tracking Updates:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                    <li>Package picked up from warehouse</li>
                    <li>In transit to your city</li>
                    <li>Out for delivery (upcoming)</li>
                </ul>
            </div>
        </div>
    `;
    trackingResult.classList.add('active');
}

// Notifications
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-hover);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
