// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { Component } from 'react';
import Button from '@parity/ui/lib/Button';
import Form from 'semantic-ui-react/dist/commonjs/collections/Form';
import { FormattedMessage } from 'react-intl';
import HardwareStore from '@parity/shared/lib/mobx/hardwareStore';
import IdentityIcon from '@parity/ui/lib/IdentityIcon';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import pick from 'lodash/pick';

import styles from './ConfirmViaHardware.css';

@observer
class ConfirmViaHardware extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {
    address: PropTypes.string.isRequired,
    isDisabled: PropTypes.bool,
    request: PropTypes.object.isRequired,
    transaction: PropTypes.object
  };

  state = {
    isSending: false,
    error: null
  };

  hardwareStore = HardwareStore.get(this.context.api);

  handleConfirm = () => {
    const { api } = this.context;
    const { request, transaction } = this.props;

    if (!transaction) {
      // Handle signing messages and decrypting with hardware wallet is not supported yet
      // request.sign is not empty if request was `eth_sign`
      // request.decrypt is not empty if request was ``parity_decryptMessage`
      // promise = ... // TODO
      this.setState({ error: 'Signing and decrypting messages is not yet supported with hardware wallets' });
      return;
    }

    this.setState({ isSending: true });

    return api.signer
      .confirmRequest(request.id, pick(transaction, ['condition', 'gas', 'gasPrice']), '')
      .then(() => {
        this.setState({ isSending: false });
      })
      .catch(error => {
        this.setState({
          isSending: false,
          error: error && error.text
        });
      });
  };

  render () {
    const { address, isDisabled } = this.props;
    const { isSending } = this.state;
    const _isDisabled = isDisabled || !this.hardwareStore.isConnected(address);

    return (
      <div className={ styles.confirmForm }>
        <Form>
          {this.renderHint()}
          {this.renderError()}
          <div data-effect='solid' data-for={ `transactionConfirmForm${this.id}` } data-place='bottom' data-tip>
            <Button
              className={ styles.confirmButton }
              isDisabled={ _isDisabled || isSending }
              fullWidth
              icon={ <IdentityIcon address={ address } button className={ styles.signerIcon } /> }
              label={
                isSending ? (
                  <FormattedMessage id='signer.txPendingConfirm.buttons.confirmBusy' defaultMessage='Confirming...' />
                ) : (
                  <FormattedMessage
                    id='signer.txPendingConfirm.buttons.confirmRequest'
                    defaultMessage='Confirm Request'
                  />
                )
              }
              onClick={ this.handleConfirm }
            />
          </div>
        </Form>
      </div>
    );
  }

  renderError () {
    const { error } = this.state;

    return <div className={ styles.error }>{error}</div>;
  }

  renderHint () {
    const { address, isDisabled } = this.props;
    const { isSending } = this.state;
    const _isDisabled = isDisabled || !this.hardwareStore.isConnected(address);

    if (isSending) {
      return (
        <div className={ styles.passwordHint }>
          <FormattedMessage
            id='signer.sending.hardware.confirm'
            defaultMessage='Please confirm the transaction on your attached hardware device'
          />
        </div>
      );
    } else if (_isDisabled) {
      return (
        <div className={ styles.passwordHint }>
          <FormattedMessage
            id='signer.sending.hardware.connect'
            defaultMessage='Please attach your hardware device before confirming the transaction'
          />
        </div>
      );
    }

    return (
      <div className={ styles.passwordHint }>
        <FormattedMessage
          id='signer.sending.hardware.next'
          defaultMessage='Please start the hardware confirmation process via the button below'
        />
      </div>
    );
  }
}

export default ConfirmViaHardware;
