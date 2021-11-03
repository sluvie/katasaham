FROM python:3.8

RUN pip install flask jinja2 psycopg2-binary

EXPOSE 3001

COPY ./ /app

WORKDIR "/app"
CMD ["python3.8", "server.py"]

