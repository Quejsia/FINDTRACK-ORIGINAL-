/* Simple auth for login & signup
   - stores users in 'users' localStorage key
   - stores session in 'sessionUser' (object)
*/
document.addEventListener("DOMContentLoaded", ()=>{
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  if(signupForm){
    signupForm.addEventListener("submit", e=>{
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim().toLowerCase();
      const pass = document.getElementById("signupPass").value;
      let users = [];
      try { users = JSON.parse(localStorage.getItem("users")||"[]"); } catch { users = []; }
      if(users.find(u=>u.email===email)){ alert("Email already registered"); return; }
      const user = { id: 'u'+Date.now(), name, email, pass };
      users.push(user);
      localStorage.setItem("users", JSON.stringify(users));
      // create minimal profile and session
      localStorage.setItem("sessionUser", JSON.stringify({ id:user.id, name:user.name, email:user.email }));
      localStorage.setItem("userProfile", JSON.stringify({ name:user.name, email:user.email, avatar:"" }));
      window.location.href = "index.html";
    });
  }

  if(loginForm){
    loginForm.addEventListener("submit", e=>{
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const pass = document.getElementById("loginPass").value;
      let users = [];
      try { users = JSON.parse(localStorage.getItem("users")||"[]"); } catch { users = []; }
      const matched = users.find(u=>u.email===email && u.pass===pass);
      if(matched){
        localStorage.setItem("sessionUser", JSON.stringify({ id:matched.id, name:matched.name, email:matched.email }));
        // ensure userProfile exists
        const prof = { name: matched.name, email: matched.email, avatar:"" };
        localStorage.setItem("userProfile", JSON.stringify(prof));
        window.location.href = "index.html";
      } else {
        alert("Invalid email or password");
      }
    });
  }
});