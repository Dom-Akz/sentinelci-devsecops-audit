FROM python:latest

ADD requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

ADD app.py /app/app.py

ENV FLASK_DEBUG=1
EXPOSE 5000

CMD ["python", "/app/app.py"]
