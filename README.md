 
# ![Jira logo](logo.png "Jira logo") Jira connector

Jira connector for the [Mittelstands plattform](https://app.msp-live.external.otc.telekomcloud.com/ "MittelStands platform")

> Jira is a proprietary issue tracking product developed by Atlassian that allows bug tracking and agile project management.

## Use cases
The Jira connector is a powerful tool and can be used to create a lot of useful flows. 

A more complex use case is one in which the Jira connector will be integrated with the OTRS connector resulting in a complex sync of the two apps. We can automatically create Jira issues from OTRS tickets as soon as they are created, and vice-versa. We can also transform Jira comments into OTRS articles, add attachments, close an issue when a ticket moves to a different queue, all of this while also being able to filter Jira issues by date, projects, authors, labels, status and many others.     

## Setting up credentials
The first step in using Jira connector is configuring the credentials
1. On platform got to "Organize → Credentials"
2. Select the Jira connector
3. Select "+ Add New Credential" located on the right of the page
4. Give your credentials a name
5. Construct the base url for the Jira instance by using the https protocol "https://", the domain of the Jira instance "jira.instance.com" add "/jira" add "/rest/api/2"
  so the final url "https://jira.example.com/jira/rest/api/2"
6. Add your username and password
7. In case you are using custom CA certificates add them in base64
8. Click on "Verify"
9. Click on "Save"

## Using the connector
### actions: 
* addAttachment → Add Attachment to Jira issue. The file must be previously uploaded to the platform using the processAttachment action     
* addComment → Add comment to Jira issue. The text of the comment can be formatted in the markup format supported by Jira
(see https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=all)  
* createIssue → Create a new Jira Issue. This action creates a basic issue in a project, if you want it to have comment, attachments please use the other actions listed below.
* doTransition → Update a Jira Issue status. Perform a transition on an issue. When performing the transition you can update or set other issue fields
* getComments → Returns all comments for an issue
* getIssue → Returns a representation of the issue for the given issue id
* processAttachments → This action will download issue attachments and upload them to the platform while also replacing the download attachment url in the issue with the newly generated platform url.
(see https://support.elastic.io/support/solutions/articles/14000057806-working-with-binary-data-attachments-)
* updateIssue → Update a Jira issue content without any. Some data may be unable to be updated based on the settings of the Jira issue

_Most actions contain a input field called "OTHER" which will allow a user to add any other field to the input by creating a object. In this object the field is the object key and the value is the field value_
  
### triggers:
* getNewIssues → Get all new Jira issues which can filtered by the date they were created, the project they are in, the labels they contain, the statuses they have, the author of the issue, and many others. The user can also select on weather the issue will include the attachments or not. The output will be an object that contains the ticket and a property called meta which will contain the date that was stored inside of the snapshot 
* getUpdatedIssues → Get all issues that have been updated. This trigger functions the same as the getNewIssues trigger but it retrieves issues that have been updated instead of newly created ones

For more info on the Jira api (see https://docs.atlassian.com/software/jira/docs/api/REST/7.12.0/)

_**For more information about the triggers and actions usage check the file index.html in readme-usage folder**_
