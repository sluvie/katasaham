from app import app ## import app dari package app yang kita buat
import uuid

app.secret_key = "go-rocket-2021" #str(uuid.uuid4())
app.run(host="0.0.0.0", port="3001",debug=False)