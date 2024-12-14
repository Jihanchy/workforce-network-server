const express = require('express');
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n2npp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const jobsCollection = client.db('jobPortal').collection('jobs')
        const jobApplicationCollection = client.db('jobPortal').collection('job-applications')

        app.get('/jobs', async (req, res) => {
            const email = req.query.email;
            let query = {}
            if (email) {
                query = { hr_email: email }
            }
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })
        app.post('/jobs', async (req, res) => {
            const newJob = req.body
            const result = await jobsCollection.insertOne(newJob)
            res.send(result)
        })
        app.get('/job-applications/jobs/:job_id', async (req, res) => {
            const jobId = req.params.job_id
            const query = { job_id: jobId }
            const result = await jobApplicationCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/job-applications', async (req, res) => {
            const email = req.query.email
            const query = { applicant_email: email }
            const result = await jobApplicationCollection.find(query).toArray()
            for (const application of result) {
                console.log(application.job_id)
                const query1 = { _id: new ObjectId(application.job_id) }
                const job = await jobsCollection.findOne(query1)
                if (job) {
                    application.title = job.title;
                    application.company = job.company;
                    application.location = job.location;
                    application.company_logo = job.company_logo
                }
            }
            res.send(result)
        })

        app.post('/job-applications', async (req, res) => {
            const applications = req.body
            const result = await jobApplicationCollection.insertOne(applications)
            const id = applications.job_id
            const query = { _id: new ObjectId(id) }
            const job = await jobsCollection.findOne(query)
            console.log(job)
            let newCount = 0
            if (job.applicationCount) {
                newCount = job.applicationCount + 1
            } else {
                newCount = 1
            }
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    applicationCount: newCount
                }
            }
            const updatedResult = await jobsCollection.updateOne(filter, updatedDoc)

            res.send(result)
        })
        app.patch('/job-applications/:id', async (req, res) => {
            const id = req.params.id
            const body = req.body
            const filter = { _id: new ObjectId(id) }
            const updatedDoc= {
                $set:{
                    status:body.status
                }
            }
            const result = await jobApplicationCollection.updateOne(filter,updatedDoc)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('the server is running')
})

app.listen(port, () => {
    console.log(`this server is running on port : ${port}`)
})