## API Management

## Initial Setup

1. Clone the repo: `git clone git@github.com:node-labs/api-management.git`
2. Install packages: `npm install`
3. Update the database configuration in `config/database.js`
4. Run `npm start`
5. Visit in your browser at: `http://127.0.0.1:8000`

### Features

Basic validation of the API requests

Proxy requests to other end points

Cache the API 

Composing the response from multiple APIs

Monitoring the performance, response etc in a Metric server based on Elastic search/Kibana

Configure additional APIs and validators dynamically


### Highlevel Design

![alt tag](https://github.com/node-labs/api-management/blob/master/images/high-level-design.png)

### Wireframes
![alt tag](https://github.com/node-labs/api-management/blob/master/images/wireframe-home-page.png)
****
![alt tag](https://github.com/node-labs/api-management/blob/master/images/wireframe-create-edit-config.png)
****
![alt tag](https://github.com/node-labs/api-management/blob/master/images/wireframe-monitoring-dashboard.png)

