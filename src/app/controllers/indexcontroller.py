from flask import (
        render_template, 
        g,
        request,
        session,
        redirect,
        url_for
)
from app import app
from app.settings import APP_CONFIG

# database
from app.models.User_m import User_m

@app.before_request
def before_request():
        g.user = None
        if 'user' in session:
                # find user based on userid, update information user
                user = session['user']
                g.user = user


@app.route('/', methods = ['GET'])
@app.route("/index")
def index():
        # auth page
        if not g.user:
                return redirect(url_for('login'))
        
        return render_template('index.html', title=APP_CONFIG["title"], description="")


@app.route('/login', methods = ['GET', 'POST'])
def login():
        if request.method == 'POST':
                session.pop('user', None)
                username = request.form['username']
                password = request.form['password']
                
                user_m = User_m()
                user = user_m.get(username)
                
                if user and user['password'] == password:
                        session['user'] = user
                        return redirect(url_for('welcome'))
                
                return redirect(url_for('login'))

        return render_template('login.html', title=APP_CONFIG["title"], description="")


@app.route('/logout', methods = ['GET'])
def logout():
        session.pop('user', None)
        g.user = None
        return redirect(url_for('login'))


@app.route('/register', methods = ['POST'])
def register():
        
        params = request.json
        username = params['username']
        password = params['password']
        retype_password = params['retype-password']
        npk = params['npk']
        nameuser = params['nameuser']
        email = params['email']

        valid = True
        message = ""
        if username == None or username == "":
                message = message + "Username can't empty. \n"
                valid = False
        else:
                if len(str(username)) > 50:
                        message = message + "Username size only less more 50 characters. \n"
                        valid = False
                        
        if password == None or password == "":
                message = message + "Password can't empty. \n"
                valid = False
        else:
                if len(str(password)) > 50:
                        message = message + "Password size only less more 50 characters. \n"
                        valid = False
                if len(str(password)) < 6:
                        message = message +password+ "Password minimal 6 charackters. \n"
                        valid = False
        
        if retype_password == None or retype_password == "":
                message = message + "Re-Type Password can't empty. \n"
                valid = False
        else:
                if len(str(retype_password)) > 10:
                        message = message + "Re-Type Password size only less more 50 characters. \n"
                        valid = False
                        
        if npk == None or npk == "":
                message = message + "NPK can't empty. \n"
                valid = False
        else:
                if len(str(npk)) > 10:
                        message = message + "NPK size only less more 10 characters. \n"
                        valid = False
                        
        if nameuser == None or nameuser == "":
                message = message + "Name can't empty. \n"
                valid = False
        
        if email == None or email == "":
                message = message + "Email can't empty. \n"
                valid = False
                
        if password == retype_password:
                pass
        else:
                message = message + "Password and Re-Type Password not match. \n"
                valid = False
                
        # insert to db
        data = []
        if valid:
                # generete key
                secretkey = Fernet.generate_key()
                cipher_suite = Fernet(secretkey)
                encoded_password = cipher_suite.encrypt(password.encode())
                '''
                cipher_suite = Fernet(key)
                encoded_text = cipher_suite.encrypt(b"Hello stackoverflow!")
                decoded_text = cipher_suite.decrypt(encoded_text)
                '''
                
                user_m = User_m()
                success, data, message = user_m.register(username, encoded_password, npk, nameuser, secretkey, "register",email)
                valid = success
                
                if success:
                        # set the session, and must redirect to index page
                        session['user'] = data
                        return redirect(url_for('welcome'))
                        

        return {
                "success": "1" if valid else "0",
                "message": message,
                "data": data
        }