import psycopg2
import psycopg2.extras
from app.settings import DATABASE_CONFIG

class User_m:
    
    def __init__(self) -> None:
        self.conn = psycopg2.connect(
            host=DATABASE_CONFIG["host"],
            port=DATABASE_CONFIG["port"],
            database=DATABASE_CONFIG["database"],
            user=DATABASE_CONFIG["user"],
            password=DATABASE_CONFIG["password"])
        psycopg2.extras.register_uuid()


    def list(self):
        try:
            cur = self.conn.cursor()
            query = "select " \
                    "   [userid] " \
                    "   ,[username] " \
                    "   ,[password] " \
                    "   ,[isactive] " \
                    "   ,[isadmin] " \
                    "   ,[isapprove] " \
                    "   ,[npk] " \
                    "   ,[name] " \
                    "   ,[email] " \
                    "   ,[secretkey] " \
                    "   ,[created] " \
                    "from [mpm_apps_user] " \
                    "order by created asc"
            cur.execute(query, ())
            rows = cur.fetchall()
            if rows == None:
                return []
            else:
                result = []
                for row in rows:
                    row = {
                        'userid': row[0],
                        'username': row[1],
                        'password': row[2],
                        'isactive': row[3],
                        'isadmin': row[4],
                        'isapprove': row[5],
                        'npk': row[6],
                        'name': row[7],
                        'email': row[8],
                        'secretkey': row[9],
                        'created': row[10],
                    }
                    result.append(row)
                return result
        except psycopg2.Error as e:
            print(e)
            return []
        
        
    def register(self, username, password, npk, nameuser, secretkey, createby, email):
        try:
            cur = self.conn.cursor()
            query = "DECLARE @uid uniqueidentifier; SET @uid  = newid();" \
                "insert into mpm_apps_user(userid, username, password, npk, name, secretkey, createby, email) values(@uid, %s, %s, %s, %s, %s, %s,%s);" \
                "select userid, username, npk, name from mpm_apps_user where userid=@uid;"
            cur.execute(query, (username, password, npk, nameuser, secretkey, createby, email,))
            row = cur.fetchone()
            data = []
            if row == None:
                data = []
            else:
                data = {
                    'userid': row[0],
                    'username': row[1],
                    'npk': row[2],
                    'name': row[3]
                }
            self.conn.commit()
            return True, data, ""
        except psycopg2.Error as e:
            print(e)
            return False, [], str(e)

    def readone(self,userid):
            try:
                cur = self.conn.cursor()
                query = "select " \
                        "   [userid] " \
                        "   ,[username] " \
                        "   ,[password] " \
                        "   ,[isactive] " \
                        "   ,[isadmin] " \
                        "   ,[isapprove] " \
                        "   ,[npk] " \
                        "   ,[name] " \
                        "   ,[email] " \
                        "   ,[secretkey] " \
                        "   ,[created] " \
                        "from [mpm_apps_user] " \
                        "where userid = %s"\
                        "order by created asc"

                cur.execute(query, (userid,))
                rows = cur.fetchone()
                if rows == None:
                    return []
                else:
                    row = {
                        'userid': rows[0],
                        'username': rows[1],
                        'password': rows[2],
                        'isactive': rows[3],
                        'isadmin': rows[4],
                        'isapprove': rows[5],
                        'npk': rows[6],
                        'name': rows[7],
                        'email': rows[8],
                        'secretkey': rows[9],
                        'created': rows[10],
                    }
                    return row
            except psycopg2.Error as e:
                print(e)
                return []

    def npkvalidation(self,userid, npk):
            try:
                cur = self.conn.cursor()
                query = "select " \
                        "   [userid] " \
                        "   ,[username] " \
                        "   ,[password] " \
                        "   ,[isactive] " \
                        "   ,[isadmin] " \
                        "   ,[isapprove] " \
                        "   ,[npk] " \
                        "   ,[name] " \
                        "   ,[email] " \
                        "   ,[secretkey] " \
                        "   ,[created] " \
                        "from [mpm_apps_user] " \
                        "where userid <> %s and npk = %s"\
                        "order by created asc"

                cur.execute(query, (userid, npk,))
                rows = cur.fetchone()
                if rows == None:
                    return []
                else:
                    row = {
                        'userid': rows[0],
                        'username': rows[1],
                        'password': rows[2],
                        'isactive': rows[3],
                        'isadmin': rows[4],
                        'isapprove': rows[5],
                        'npk': rows[6],
                        'name': rows[7],
                        'email': rows[8],
                        'secretkey': rows[9],
                        'created': rows[10],
                    }
                    return row
            except psycopg2.Error as e:
                print(e)
                return []

    def update(self, userid, npk,name, email, isactive, isadmin, isapprove, updateby):
            try:
                cur = self.conn.cursor()
                query = "update mpm_apps_user set " \
                    "name=%s, email=%s, npk=%s, isactive =%s,isadmin =%s, isapprove =%s,modifby = %s, modified=getdate() " \
                    "where userid=%s"
                cur.execute(query, ( name, email, npk, isactive, isadmin, isapprove, updateby, userid, ))
                self.conn.commit()
                return True, ""
            except psycopg2.Error as e:
                self.conn.rollback()
                return False, str(e)