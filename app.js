require('dotenv').config({ path: `${process.cwd()}/.env` });
const express = require('express');
const authRoute = require('./route/authRoute');
const invitationRoute = require('./route/invitationRoute');

const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors({
  origin: '*', // Pour développement seulement
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());


app.use('/api/v1/invitations', invitationRoute);
app.use('/api/v1/auth', authRoute);



app.get('/', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: `Bravo`
    });
  });


5
app.use('*', (req, res,next) => {
    res.status(404).json({
      status: 'fail',
      message: `Route  not found on this server`
    });
  });



const PORT = process.env.APP_Route ||5000;
app.listen(PORT,'0.0.0.0',() => {
    console.log(`Serveur démarré et run`,PORT);
  });