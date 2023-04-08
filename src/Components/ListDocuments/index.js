import React, { useCallback, useState } from 'react';
import moment from 'moment';
import { debounce } from 'lodash';

import { Col, Drawer, Row, Button, Input, Table, Tooltip, Modal } from 'antd';
import { gapi } from 'gapi-script';
const { Search } = Input;

const CLIENT_ID = process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_DRIVE_API_KEY;

const URL = 'https://www.googleapis.com/drive/v3/files';
const FIELDS = 'name, mimeType, modifiedTime';

const ListDocuments = ({ visible, onClose, documents = [], onSearch, signedInUser, onSignOut, isLoading, onDownload, getFileInfo, listPermissions}) => {
  const search = (value) => {
    delayedQuery(`name contains '${value}'`);
  };
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentId, setCurrentId] = useState();
  const [fileInfo, setFileInfo] = useState();
  const delayedQuery = useCallback(
    debounce((q) => onSearch(q), 500),
    []
  );
  // onDownload();
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Last Modified Date',
      dataIndex: 'modifiedTime',
      key: 'modifiedTime',
      render: (text) => <span>{moment(text).format('Do MMM YYYY HH:mm A')}</span>,
    },
    {
      title: 'Action',
      key: 'status',
      dataIndex: 'status',
      render: (text, record) => (
        <span>
          <Tooltip title="Download Document">
            <Button type="primary" onClick={() => onDownload(record)}>
              Select
            </Button>
          </Tooltip>
        </span>
      ),
    },
    {
      title: 'Info',
      key: 'status',
      dataIndex: 'status',
      render: (text, record) => (
        <span>
          <Tooltip title="View">
            <Button
              type="primary"
              onClick={() => {
                setIsModalVisible(true);
                setCurrentId(record.id);
                listPermissions(record.id, setFileInfo);
              }}
            >
              View
            </Button>
          </Tooltip>
        </span>
      ),
    },
  ];

  const columns_file = [
    {
      title: 'Name',
      dataIndex: 'displayName',
      key: 'displayName',
    },
    {
      title: 'Email',
      dataIndex: 'emailAddress',
      key: 'emailAddress',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
  ];
  return (
    <Drawer
      title="Select Google Drive Document"
      placement="right"
      closable
      onClose={onClose}
      visible={visible}
      width={900}
    >
      <Row gutter={16}>
        <Col span={24}>
          <div style={{ marginBottom: 20 }}>
            <p>Signed In as: {`${signedInUser?.Ad} (${signedInUser?.zu})`}</p>
            <Button type="primary" onClick={onSignOut}>
              Sign Out
            </Button>
          </div>

          <div className="table-card-actions-container">
            <div className="table-search-container">
              <Search
                placeholder="Search Google Drive"
                onChange={(e) => search(e.target.value)}
                onSearch={(value) => search(value)}
                className="table-search-input"
                size="large"
                enterButton
              />
            </div>
          </div>
          <Table
            className="table-striped-rows"
            columns={columns}
            dataSource={documents}
            pagination={{ simple: true }}
            loading={isLoading}
          />

          <Modal
              title="File Share Info"
              visible={isModalVisible}
              onOk={() => {
                setIsModalVisible(false);
            }}
              onCancel={() => {
                setIsModalVisible(false);
              }}
            >
              {/* <p>{JSON.stringify(currentId)}</p>
            <p>{JSON.stringify(fileInfo)}</p> */}
            <Table
              className="table-striped-rows"
              columns={columns_file}
              dataSource={fileInfo}
              // pagination={{ simple: true }}
              // loading={isLoading}
            />
          </Modal>
        </Col>
      </Row>
    </Drawer>
  );
};

export default ListDocuments;
