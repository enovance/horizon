#    Copyright 2013, Big Switch Networks, Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

import re

from django.core.urlresolvers import reverse_lazy
from django.utils.translation import ugettext_lazy as _

from horizon import exceptions
from horizon import forms
from horizon import messages
from horizon import tabs
from horizon.utils import memoized
from horizon import workflows

from openstack_dashboard import api
from openstack_dashboard.dashboards.project.firewalls \
    import forms as fw_forms
from openstack_dashboard.dashboards.project.firewalls \
    import tabs as fw_tabs
from openstack_dashboard.dashboards.project.firewalls \
    import workflows as fw_workflows

InsertRuleToPolicy = fw_forms.InsertRuleToPolicy
RemoveRuleFromPolicy = fw_forms.RemoveRuleFromPolicy
UpdateFirewall = fw_forms.UpdateFirewall
UpdatePolicy = fw_forms.UpdatePolicy
UpdateRule = fw_forms.UpdateRule

FirewallDetailsTabs = fw_tabs.FirewallDetailsTabs
FirewallTabs = fw_tabs.FirewallTabs
PolicyDetailsTabs = fw_tabs.PolicyDetailsTabs
RuleDetailsTabs = fw_tabs.RuleDetailsTabs

AddFirewall = fw_workflows.AddFirewall
AddPolicy = fw_workflows.AddPolicy
AddRule = fw_workflows.AddRule


class IndexView(tabs.TabView):
    tab_group_class = (FirewallTabs)
    template_name = 'project/firewalls/details_tabs.html'

    def post(self, request, *args, **kwargs):
        obj_ids = request.POST.getlist('object_ids')
        action = request.POST['action']
        obj_type = re.search('.delete([a-z]+)', action).group(1)
        if not obj_ids:
            obj_ids.append(re.search('([0-9a-z-]+)$', action).group(1))
        if obj_type == 'rule':
            for obj_id in obj_ids:
                try:
                    api.fwaas.rule_delete(request, obj_id)
                    messages.success(request, _('Deleted rule %s') % obj_id)
                except Exception as e:
                    exceptions.handle(request,
                                      _('Unable to delete rule. %s') % e)
        if obj_type == 'policy':
            for obj_id in obj_ids:
                try:
                    api.fwaas.policy_delete(request, obj_id)
                    messages.success(request, _('Deleted policy %s') % obj_id)
                except Exception as e:
                    exceptions.handle(request,
                                      _('Unable to delete policy. %s') % e)
        if obj_type == 'firewall':
            for obj_id in obj_ids:
                try:
                    api.fwaas.firewall_delete(request, obj_id)
                    messages.success(request,
                                     _('Deleted firewall %s') % obj_id)
                except Exception as e:
                    exceptions.handle(request,
                                      _('Unable to delete firewall. %s') % e)
        return self.get(request, *args, **kwargs)


class AddRuleView(workflows.WorkflowView):
    workflow_class = AddRule
    template_name = "project/firewalls/addrule.html"
    page_title = _("Add New Rule")


class AddPolicyView(workflows.WorkflowView):
    workflow_class = AddPolicy
    template_name = "project/firewalls/addpolicy.html"
    page_title = _("Add New Policy")


class AddFirewallView(workflows.WorkflowView):
    workflow_class = AddFirewall
    template_name = "project/firewalls/addfirewall.html"
    page_title = _("Add New Firewall")


class FireWallDetailTabs(tabs.TabView):
    template_name = 'project/firewalls/details_tabs.html'
    page_title = _("Firewalls")


class RuleDetailsView(FireWallDetailTabs):
    tab_group_class = (RuleDetailsTabs)


class PolicyDetailsView(FireWallDetailTabs):
    tab_group_class = (PolicyDetailsTabs)


class FirewallDetailsView(FireWallDetailTabs):
    tab_group_class = (FirewallDetailsTabs)


class UpdateRuleView(forms.ModalFormView):
    form_class = UpdateRule
    template_name = "project/firewalls/updaterule.html"
    context_object_name = 'rule'
    success_url = reverse_lazy("horizon:project:firewalls:index")
    page_title = _("Edit Rule {{ name }}")

    def get_context_data(self, **kwargs):
        context = super(UpdateRuleView, self).get_context_data(**kwargs)
        context['rule_id'] = self.kwargs['rule_id']
        obj = self._get_object()
        if obj:
            context['name'] = obj.name_or_id
        return context

    @memoized.memoized_method
    def _get_object(self, *args, **kwargs):
        rule_id = self.kwargs['rule_id']
        try:
            rule = api.fwaas.rule_get(self.request, rule_id)
            return rule
        except Exception:
            redirect = self.success_url
            msg = _('Unable to retrieve rule details.')
            exceptions.handle(self.request, msg, redirect=redirect)

    def get_initial(self):
        rule = self._get_object()
        initial = rule.get_dict()
        protocol = initial['protocol']
        initial['protocol'] = protocol.upper() if protocol else 'ANY'
        initial['action'] = initial['action'].upper()
        return initial


class UpdatePolicyView(forms.ModalFormView):
    form_class = UpdatePolicy
    template_name = "project/firewalls/updatepolicy.html"
    context_object_name = 'policy'
    success_url = reverse_lazy("horizon:project:firewalls:index")
    page_title = _("Edit Policy {{ name }}")

    def get_context_data(self, **kwargs):
        context = super(UpdatePolicyView, self).get_context_data(**kwargs)
        context["policy_id"] = self.kwargs['policy_id']
        obj = self._get_object()
        if obj:
            context['name'] = obj.name_or_id
        return context

    @memoized.memoized_method
    def _get_object(self, *args, **kwargs):
        policy_id = self.kwargs['policy_id']
        try:
            policy = api.fwaas.policy_get(self.request, policy_id)
            return policy
        except Exception:
            redirect = self.success_url
            msg = _('Unable to retrieve policy details.')
            exceptions.handle(self.request, msg, redirect=redirect)

    def get_initial(self):
        policy = self._get_object()
        initial = policy.get_dict()
        return initial


class UpdateFirewallView(forms.ModalFormView):
    form_class = UpdateFirewall
    template_name = "project/firewalls/updatefirewall.html"
    context_object_name = 'firewall'
    success_url = reverse_lazy("horizon:project:firewalls:index")
    page_title = _("Edit Firewall {{ name }}")

    def get_context_data(self, **kwargs):
        context = super(UpdateFirewallView, self).get_context_data(**kwargs)
        context["firewall_id"] = self.kwargs['firewall_id']
        obj = self._get_object()
        if obj:
            context['name'] = obj.name
        return context

    @memoized.memoized_method
    def _get_object(self, *args, **kwargs):
        firewall_id = self.kwargs['firewall_id']
        try:
            firewall = api.fwaas.firewall_get(self.request,
                                              firewall_id)
            return firewall
        except Exception:
            redirect = self.success_url
            msg = _('Unable to retrieve firewall details.')
            exceptions.handle(self.request, msg, redirect=redirect)

    def get_initial(self):
        firewall = self._get_object()
        initial = firewall.get_dict()
        return initial


class InsertRuleToPolicyView(forms.ModalFormView):
    form_class = InsertRuleToPolicy
    template_name = "project/firewalls/insert_rule_to_policy.html"
    context_object_name = 'policy'
    success_url = reverse_lazy("horizon:project:firewalls:index")
    page_title = _("Insert Rule to Policy")

    def get_context_data(self, **kwargs):
        context = super(InsertRuleToPolicyView,
                        self).get_context_data(**kwargs)
        context["policy_id"] = self.kwargs['policy_id']
        obj = self._get_object()
        if obj:
            context['name'] = obj.name_or_id
        return context

    @memoized.memoized_method
    def _get_object(self, *args, **kwargs):
        policy_id = self.kwargs['policy_id']
        try:
            policy = api.fwaas.policy_get(self.request, policy_id)
            return policy
        except Exception:
            redirect = self.success_url
            msg = _('Unable to retrieve policy details.')
            exceptions.handle(self.request, msg, redirect=redirect)

    def get_initial(self):
        policy = self._get_object()
        initial = policy.get_dict()
        initial['policy_id'] = initial['id']
        return initial


class RemoveRuleFromPolicyView(forms.ModalFormView):
    form_class = RemoveRuleFromPolicy
    template_name = "project/firewalls/remove_rule_from_policy.html"
    context_object_name = 'policy'
    success_url = reverse_lazy("horizon:project:firewalls:index")
    page_title = _("Remove Rule from Policy")

    def get_context_data(self, **kwargs):
        context = super(RemoveRuleFromPolicyView,
                        self).get_context_data(**kwargs)
        context["policy_id"] = self.kwargs['policy_id']
        obj = self._get_object()
        if obj:
            context['name'] = obj.name_or_id
        return context

    @memoized.memoized_method
    def _get_object(self, *args, **kwargs):
        policy_id = self.kwargs['policy_id']
        try:
            policy = api.fwaas.policy_get(self.request, policy_id)
            return policy
        except Exception:
            redirect = self.success_url
            msg = _('Unable to retrieve policy details.')
            exceptions.handle(self.request, msg, redirect=redirect)

    def get_initial(self):
        policy = self._get_object()
        initial = policy.get_dict()
        initial['policy_id'] = initial['id']
        return initial
