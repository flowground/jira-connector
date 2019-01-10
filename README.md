# eio.jira
Jira connector for the [elastic.io platform](http://www.elastic.io "elastic.io platform")

> Jira is a proprietary issue tracking product developed by Atlassian that allows bug tracking and agile project management.

## Setting up credentials
The first step in using Jira connector is configuring the credentials
1. On the sidebar on the left of the elastic.io platform got to "Organize → Credentials"
2. Select "+ Add New Credential" located on the right of the page
3. Give your credentials a name
4. Construct the base url for the Jira instance by using the https protocol "https://", the domain of the Jira instance "jira.instance.com" add "/jira" add "/rest/api/2"
  so the final url "https://jira.example.com/jira/rest/api/2"
5. Add your username and password
6. In case you are using custom CA certificates add them in base64
7. Click on "Verify"

## Using the connector
### actions: 
* addAttachment → Add Attachment to Jira issue. The file must be previously uploaded to the elastic.io platform     
* addComment → Add comment to Jira issue
* createIssue → Create a Jira Issue
* doTransition → Update a Jira Issue status
* getComments → Get Jira issue comments
* getIssue → Get Jira issue
* processAttachments → Download issue attachments from Jira and upload them to the elastic.io platform.
* updateIssue → Update a Jira Issue 
  
### triggers:
* getNewIssues → Get all new issues, based on a given start date
* getUpdatedIssues → Get all issues that have been updated after a given date

For more info on the Jira api (see https://docs.atlassian.com/software/jira/docs/api/REST/7.12.0/)

_**For more information about the triggers and actions usage check the file index.html in readme-usage folder**_
