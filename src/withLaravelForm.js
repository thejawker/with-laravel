import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'underscore'
import S from 'string'

/**
 * The H.O.C. will take care of the form data and display the
 * errors and exceptions on the input field when possible.
 *
 * The trick is to stop thinking about error handling.
 *
 *
 render() {
        return (
            <div>
                {...this.props.form.renderErrors()}
                <Textfield
                    {..this.props.form.textField('input_name')}
                />
               <Textfield
                    {..this.props.form.textField('other_input')}
                />
                <RadioGroup
                     {...this.props.form.radioGroup('options')}
                 >
                    <FormControlLabel value="one" control={<Radio/>} label="Male"/>
                    <FormControlLabel value="two" control={<Radio/>} label="Female"/>
                    <FormControlLabel value="three" control={<Radio/>} label="Other"/>
                 </RadioGroup>
                <Button type="submit" loading={this.props.form.sending}>
                    Submit
                </Button>
            </div
        )
   }
 */

function withLaravelForm(
    EnhancedComponent,
    options = { endPoint: null, takeAtLeast: null, params: null, formName: null },
) {
    return class LaravelForm extends Component {
        static propTypes = {
            onFormSuccess: PropTypes.func,
            onFormFail: PropTypes.func,
        }

        static defaultProps = {
            takeAtLeast: 400,
            formName: Math.random(),
            onFormSuccess: response => response,
            onFormFail: response => response,
        }

        constructor(props) {
            super(props)

            this.inputs = []
            this.dontDisplayErrorsFor = {}

            this.state = {
                message: null,
                inputErrors: [],
                sending: false,
                success: false,
                formFields: {},
                routeParams: null,
            }
        }

        componentDidMount() {
            this.form.addEventListener('keydown', this.bindListener)
        }

        componentWillUnmoutn() {
            this.form.removeEventListener('keydown', this.bindListener)
        }

        bindListener = (e) => {
            if (e.keyCode === 13 && e.metaKey) {
                this.submitForm(e)
            }
        }

        getTextFieldProps = name => ({
            inputRef: (input) => {
                this.inputs[name] = input
            },
            name,
            label: S(name).humanize().s,
            ...this.getInputErrors(name),
        })

        getRadioGroupProps = (name) => {
            const props = {
                value: this.getStatefulFormValueFor(name) || '',
                onChange: (event, value) => this.updateStatefulFormValueFor(name, value),
                name,
                label: S(name).humanize().s,
            }
            return props
        }

        getStatefulFormValueFor = name => this.state.formFields[name] || null

        getInputErrors = (name) => {
            this.dontDisplayErrorsFor = {
                ...this.dontDisplayErrorsFor,
                [name]: name,
            }

            if (!this.state.inputErrors[name]) {
                return null
            }

            return {
                helperText: this.getError(name),
                error: !!this.getError(name),
            }
        }

        getError = (name) => {
            if (this.state.inputErrors[name]) {
                return this.state.inputErrors[name][0]
            }

            return null
        }

        getOption = name => (options[name] ? options[name] : this.props[name])

        focusOnFirstErrorInput = () => {
            if (this.state.inputErrors.length === 0) {
                return
            }

            const focusOnInput = Object.keys(this.state.inputErrors)[0]
            if (this.inputs[focusOnInput]) {
                window.setTimeout(() => {
                    this.inputs[focusOnInput].focus()
                }, 200)
            }
        }

        updateStatefulFormValueFor = (name, value) => {
            this.setState(() => ({
                formFields: {
                    [name]: value,
                },
            }))
        }

        emptyFormFields = () => {
            this.form.reset()
        }

        submitForm = (event) => {
            event.preventDefault()
            this.setState({ sending: true })

            const formData = this.getAllFormData()

            const params = this.getOption('params')

            const args = params ? [...params, formData] : [formData]

            this.getOption('endPoint')(...args)
                .takeAtLeast(this.getOption('takeAtLeast'))
                .then((data) => {
                    this.setState({ sending: false, errors: [], success: true })
                    this.props.onFormSucess(data)
                    this.emptyFormFields()
                })
                .catch((response) => {
                    this.props.onFormFail(response)
                    if (response.response.status === 422) {
                        this.setState(
                            () => ({
                                message: response.response.data.message,
                                inputErrors: response.response.data.errors,
                                sending: false,
                            }),
                            this.focusOnFirstErrorInput,
                        )
                    }
                })
        }

        getAllFormData = () => ({
            ...this.constructFormFieldData(),
            ...this.state.formFields,
        })

        constructFormFieldData = () => {
            const formData = {}

            _.each(this.form.elements, (element) => {
                if (element.name) {
                    formData[element.name] = element.value
                }
            })

            return formData
        }

        render() {
            const { ...passThroughProps } = this.props

            const newProps = {
                form: {
                    textField: this.getTextFieldProps,
                    radioGroup: this.getRadioGroupProps,
                    errorMessage: this.state.message,
                    getAllFormData: this.getAllFormData,
                    ...this.state,
                },
            }

            return (
                <form
                  name={this.props.formName}
                  onSubmit={this.submitForm}
                  ref={(formElement) => {
                      this.form = formElement
                  }}
                >
                    <EnhancedComponent {...newProps} {...passThroughProps} />
                </form>
            )
        }
    }
}

export default withLaravelForm
