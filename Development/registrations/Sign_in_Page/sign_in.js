const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const messageBox = document.getElementById('message-box');

// switch tabs
registerTab.addEventListener('click' , async() => { 
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    messageBox.classList.add('hidden');
});

loginTab.addEventListener('click' , async() => { 
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    messageBox.classList.add('hidden');
});

document.getElementById("register-form").addEventListener('submit' , async(Event) => { 
    Event.preventDefault();   
    await registerUser();
});

document.getElementById("login-form").addEventListener('submit' , async(Event) => { 
    Event.preventDefault();   
    await loginUser();
});

function showmessage(Message, isError) { 
    messageBox.textContent = Message;
    messageBox.classList.remove('hidden', 'success', 'error'); 

    if (isError) {
        messageBox.classList.add('error');
    } else {
        messageBox.classList.add('success');
    }
    messageBox.classList.add('show'); 
}


// register user
async function registerUser(){
    const userData = {
        userName: document.getElementById('register-username').value ,
        email: document.getElementById('register-email').value ,
        password: document.getElementById('register-password').value
    }

    try{
        const response = await fetch('http://localhost:5001/api/user/register' , { 
            method: "POST" ,
            headers: {"Content-Type": "application/json"} ,
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if(!response.ok){
            throw new Error(data.message || "Registration failed. Please check your inputs.");
        }

        showmessage("Registration successful! You can now log in." , false);
        // loginTab.click();
    }
    catch(error){
        console.error("Registration error:", error); // Log full error for debugging
        showmessage(error.message , true);
    }
}


// login User
async function loginUser(){
    const credentials = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    }

    try{
        const response = await fetch('http://localhost:5001/api/user/login' , {
            method: "POST" ,
            headers: {"Content-Type": "application/json"} ,
            body: JSON.stringify(credentials)
        });

        const data = await response.json(); 

        if(!response.ok){
            throw new Error(data.message || "Login failed. Invalid credentials or server error.");
        }

        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('userName', data.userName);
        localStorage.setItem('userRole', data.role); // Store the user's role

        showmessage("Login successful! Redirecting..." , false);

        setTimeout(() => { 
            window.location.replace("http://127.0.0.1:3000/Development/index.html"); 
            
        }, 1000);

    }
    catch(error){
        console.error("Login error:", error); // Log full error for debugging
        showmessage(error.message, true);
    }
}