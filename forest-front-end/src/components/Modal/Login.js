import { Form, Icon, Input, Button, Modal } from 'antd';
import React, {Component} from 'react';
const FormItem = Form.Item;

class LoginForm extends Component {
    state = {
        modalVisible: true,
    }

    setModalVisible(modalVisible) {
        this.setState({ modalVisible });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        return (
            <Modal
                title="LOGIN & SIGNUP"
                centered
                visible={this.state.modalVisible}
                onCancel={() => this.setModalVisible(false)}
                footer={null}
            >
                <Form onSubmit={this.handleSubmit} style={{ margin: '10px'}}>
                    <FormItem>
                        {getFieldDecorator('userName', {
                            rules: [{ required: true, message: 'Please input your username!' }],
                        })(
                            <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
                        )}
                    </FormItem>
                    <FormItem>
                        {getFieldDecorator('password', {
                            rules: [{ required: true, message: 'Please input your Password!' }],
                        })(
                            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
                        )}
                    </FormItem>
                    <FormItem style={{textAlign: 'center'}}>
                        <Button type="primary" htmlType="submit">
                            Log in
                        </Button>

                        <Button type="ghost" htmlType="submit"  style={{marginLeft: '30px'}}>
                            Sign up
                        </Button>
                    </FormItem>
                </Form>
            </Modal>

        );
    }
}
export default Form.create()(LoginForm);