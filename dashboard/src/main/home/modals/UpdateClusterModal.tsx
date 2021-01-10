import React, { Component } from 'react';
import styled from 'styled-components';
import close from '../../../assets/close.png';
import gradient from '../../../assets/gradient.jpg';

import api from '../../../shared/api';
import { Context } from '../../../shared/Context';

import SaveButton from '../../../components/SaveButton';
import InputRow from '../../../components/values-form/InputRow';
import ConfirmOverlay from '../../../components/ConfirmOverlay';

type PropsType = {
  setRefreshClusters: (x: boolean) => void,
};

type StateType = {
  clusterName: string,
  status: string | null,
  showDeleteOverlay: boolean
};

export default class UpdateClusterModal extends Component<PropsType, StateType> {
  state = {
    clusterName: this.context.currentCluster.name,
    status: null as string | null,
    showDeleteOverlay: false,
  };

  handleDelete = () => {
    let { currentProject, currentCluster } = this.context;
    this.setState({ status: 'loading' });

    api.deleteCluster('<token>', {}, { 
      project_id: currentProject.id,
      cluster_id: currentCluster.id,
    }, (err: any, res: any) => {
      if (err) {
        this.setState({ status: 'error' });
        console.log(err)
      } else {

        // Handle destroying infra we've provisioned
        if (currentCluster.infra_id) {
          console.log('destroying provisioned infra...');
          api.destroyCluster('<token>', { eks_name: currentCluster.name }, { 
            project_id: currentProject.id,
            infra_id: currentCluster.infra_id,
          }, (err: any, res: any) => {
            if (err) {
              this.setState({ status: 'error' });
              console.log(err)
            } else {
              console.log('destroyed provisioned infra.');
            }
          });
        }

        this.props.setRefreshClusters(true);
        this.setState({ status: 'successful', showDeleteOverlay: false });
        this.context.setCurrentModal(null, null);
      }
    });
  }

  render() {
    return (
      <StyledUpdateProjectModal>
        <CloseButton onClick={() => {
          this.context.setCurrentModal(null, null);
        }}>
          <CloseButtonImg src={close} />
        </CloseButton>

        <ModalTitle>Cluster Settings</ModalTitle>
        <Subtitle>
          Cluster name
        </Subtitle>

        <InputWrapper>
          <DashboardIcon>
            <i className="material-icons">device_hub</i>
          </DashboardIcon>
          <InputRow
            disabled={true}
            type='string'
            value={this.state.clusterName}
            setValue={(x: string) => this.setState({ clusterName: x })}
            placeholder='ex: perspective-vortex'
            width='470px'
          />
        </InputWrapper>

        <SaveButton
          text='Delete Cluster'
          color='#b91133'
          onClick={() => this.setState({ showDeleteOverlay: true })}
          status={this.state.status}
        />

        <ConfirmOverlay
          show={this.state.showDeleteOverlay}
          message={`Are you sure you want to delete this cluster?`}
          onYes={this.handleDelete}
          onNo={() => this.setState({ showDeleteOverlay: false })}
        />

        <Warning>
         ⚠️ Deletion via Porter may result in dangling resources.  
         Please visit the AWS console to ensure that all resources have been removed.
        </Warning>

      </StyledUpdateProjectModal>
      );
  }
}

UpdateClusterModal.contextType = Context;

const DashboardIcon = styled.div`
  width: 25px;
  min-width: 25px;
  height: 25px;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  margin-right: 10px;
  font-weight: 400;
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #676C7C;
  border: 2px solid #8e94aa;
  color: white;

  > i {
    font-size: 13px;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Subtitle = styled.div`
  margin-top: 23px;
  font-family: 'Work Sans', sans-serif;
  font-size: 13px;
  color: #aaaabb;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-bottom: -10px;
`;

const ModalTitle = styled.div`
  margin: 0px 0px 13px;
  display: flex;
  flex: 1;
  font-family: 'Assistant';
  font-size: 18px;
  color: #ffffff;
  user-select: none;
  font-weight: 700;
  align-items: center;
  position: relative;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const CloseButton = styled.div`
  position: absolute;
  display: block;
  width: 40px;
  height: 40px;
  padding: 13px 0 12px 0;
  z-index: 1;
  text-align: center;
  border-radius: 50%;
  right: 15px;
  top: 12px;
  cursor: pointer;
  :hover {
    background-color: #ffffff11;
  }
`;

const CloseButtonImg = styled.img`
  width: 14px;
  margin: 0 auto;
`;

const StyledUpdateProjectModal= styled.div`
  width: 100%;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  padding: 25px 32px;
  overflow: hidden;
  border-radius: 6px;
  background: #202227;
`;

const Warning = styled.div`
  width: 65%;
  margin-top: 3px;
  font-family: 'Work Sans', sans-serif;
  font-size: 13px;
  color: #aaaabb;
  text-align: justify;
`