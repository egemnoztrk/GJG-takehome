  
from flask import Flask, jsonify,request,session,Flask, render_template, request, url_for, redirect, session, Response, make_response
import pymongo
import json
import flask
from bson import json_util
from flask_cors import CORS


application = flask.Flask(__name__)
q_client_mongo = pymongo.MongoClient("mongodb+srv://egemen:12345@cluster0.5dvoe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
mongoDB = q_client_mongo.API
CORS(application)

application.config.update( 
    DEBUG=False, 
    SECRET_KEY="65465f4a6s54f6as54g6a54ya687ytq9ew841963684", 
    supports_credentials=True)

@application.route("/get_data", methods=['post', 'get'])
def data():
    res=jsonify(json.loads(json.dumps([element for element in mongoDB.GJG_takehome.find({})], default=json_util.default)))
    res.headers.add('Access-Control-Allow-Credentials', 'true')
    return res





if __name__ == "__main__":
    application.run(port=5000)