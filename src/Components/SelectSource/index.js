import React, { useState } from 'react';
import { Row, Col, Spin } from 'antd';
import styled from 'styled-components';
import { gapi } from 'gapi-script';
import GoogleDriveImage from '../../assets/images/google-drive.png';
import ListDocuments from '../ListDocuments';
import { style } from './styles';

const NewDocumentWrapper = styled.div`
  ${style}
`;

// Client ID and API key from the Developer Console
const CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;

// Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive';

const SelectSource = () => {
  const [listDocumentsVisible, setListDocumentsVisibility] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoadingGoogleDriveApi, setIsLoadingGoogleDriveApi] = useState(false);
  const [isFetchingGoogleDriveFiles, setIsFetchingGoogleDriveFiles] = useState(false);
  const [signedInUser, setSignedInUser] = useState();
  /**
   * Print files.
   */
  const listFiles = (searchTerm = null) => {
    setIsFetchingGoogleDriveFiles(true);
    gapi.client.drive.files
      .list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
        q: searchTerm,
      })
      .then(function (response) {
        setIsFetchingGoogleDriveFiles(false);
        setListDocumentsVisibility(true);
        const res = JSON.parse(response.body);
        setDocuments(res.files);
      });
  };

  const listPermissions = (fileId, callback) => {
    // setIsFetchingGoogleDriveFiles(true);
    gapi.client.drive.permissions
      .list({
        fileId: fileId,
      })
      .then(function (response) {
        // setIsFetchingGoogleDriveFiles(false);
        // setListDocumentsVisibility(true);
        const res = JSON.parse(response.body);
        const promises = res['permissions'].map((perm) => {
          console.log(JSON.stringify(perm));
          return gapi.client.drive.permissions.get({
              fileId: fileId,
              permissionId: perm.id,
              fields: 'kind,emailAddress,role,displayName',
            }).then((resp) => JSON.parse(resp.body));
        });
        Promise.all(promises).then((result) => {
          console.log(result);
          callback(result);
        });
        // setDocuments(res.files);
      });
  };

  const handleDownload = (record) => {
    // debugger;
    // const auth = new GoogleAuth({
    //   scopes: 'https://www.googleapis.com/auth/drive',
    // });
    // const service = google.drive({ version: 'v3', auth });
    var request = gapi.client.drive.files.get({
      fileId: record.id,
      mimeType: record.mimeType,
      alt: 'media',
    });
    request.then((resp) => {
      // Console.log(resp.result);
      var type = resp.result.id;
      var id = resp.result.id;
      console.log(resp);
      var binary = resp.body;
      var len = binary.length;
      var arr = new Uint8Array(len); // create the binary arrays

      for (var i = 0; i < len; i++) {
        arr[i] = binary.charCodeAt(i);
      }
      const file = new Blob([arr], { type: resp.headers['Content-Type'] });
      // anchor link
      const element = document.createElement("a");
      element.href = URL.createObjectURL(file);
      element.setAttribute('download', record.name);
      element.download = record.name;
      // simulate link click
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      // var request = gapi.client.drive.files.export({
      //   fileId: id,
      //   mimeType: type,
      // });
    });
    // const webViewLink = await drive.files
    //   .get({
    //     fileId: file.id,
    //     fields: 'webViewLink',
    //   })
    //   .then((response) => response.data.webViewLink);
    // var request = gapi.client.drive.files.list({
    //   q: "'0Bz9_vPIAWUcSWWo0UHptQ005cnM' in parents", //folder ID
    //   fields: 'files(id, name, webContentLink, webViewLink)',
    // });
    // request.execute(function (resp) {
    //   // debugger; //access to files in this variable
    // });
  };

  const getFileInfo = (record, callback) => {
    // debugger;
    // const auth = new GoogleAuth({
    //   scopes: 'https://www.googleapis.com/auth/drive',
    // });
    // const service = google.drive({ version: 'v3', auth });
    var request = gapi.client.drive.files.get({
      fileId: record.id,
      mimeType: record.mimeType,
    });
    request.then((resp) => {
      // Console.log(resp.result);
      console.log(resp.body);
      callback(resp.body);
      return resp.body;
    });

  };

  /**
   *  Sign in the user upon button click.
   */
  const handleAuthClick = (event) => {
    gapi.auth2.getAuthInstance().signIn();
  };

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
  const updateSigninStatus = (isSignedIn) => {
    if (isSignedIn) {
      // Set the signed in user
      setSignedInUser(gapi.auth2.getAuthInstance().currentUser.je.Qt);
      setIsLoadingGoogleDriveApi(false);
      // list files if user is authenticated
      listFiles();
    } else {
      // prompt user to sign in
      handleAuthClick();
    }
  };

  /**
   *  Sign out the user upon button click.
   */
  const handleSignOutClick = (event) => {
    setListDocumentsVisibility(false);
    gapi.auth2.getAuthInstance().signOut();
  };

  /**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
   */
  const initClient = () => {
    setIsLoadingGoogleDriveApi(true);
    gapi.client
      .init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      })
      .then(
        function () {
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        },
        function (error) {}
      );
  };

  const handleClientLoad = () => {
    gapi.load('client:auth2', initClient);
  };

  const showDocuments = () => {
    setListDocumentsVisibility(true);
  };

  const onClose = () => {
    setListDocumentsVisibility(false);
  };

  return (
    <NewDocumentWrapper>
      <Row gutter={16} className="custom-row">
        <ListDocuments
          visible={listDocumentsVisible}
          onClose={onClose}
          documents={documents}
          onSearch={listFiles}
          signedInUser={signedInUser}
          onSignOut={handleSignOutClick}
          onDownload={handleDownload}
          getFileInfo={getFileInfo}
          listPermissions={listPermissions}
          isLoading={isFetchingGoogleDriveFiles}
          gapi={gapi}
        />
        <Col span={8}>
          <Spin spinning={isLoadingGoogleDriveApi} style={{ width: '100%' }}>
            <div onClick={() => handleClientLoad()} className="source-container">
              <div className="icon-container">
                <div className="icon icon-success">
                  <img height="80" width="80" src={GoogleDriveImage} />
                </div>
              </div>
              <div className="content-container">
                <p className="title">Google Drive</p>
                <span className="content">Import documents straight from your google drive</span>
              </div>
            </div>
          </Spin>
        </Col>
      </Row>
    </NewDocumentWrapper>
  );
};

export default SelectSource;
